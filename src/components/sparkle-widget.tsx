/**
 * Sparkle Widget - Floating optimization button
 *
 * Features:
 * - Floating UI positioning near active input
 * - Loading/error/success states
 * - Race condition protection
 * - AbortController for cancellable operations
 */

import * as React from "react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useFloating, autoUpdate, offset, shift } from "@floating-ui/react";
import { Wrench, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { replaceText, isElementValid, getElementText } from "~lib/dom-injector";
import { detectPlatform } from "~lib/platform-detector";
import { cn } from "~lib/utils";
import { type TextInputElement } from "~types";

// =============================================================================
// Types
// =============================================================================

interface SparkleWidgetProps {
  activeElement: TextInputElement | null;
  onProcessingComplete?: () => void;
}

type WidgetStatus = "idle" | "processing" | "success" | "error";

// =============================================================================
// Sparkle Widget Component
// =============================================================================

export const SparkleWidget: React.FC<SparkleWidgetProps> = ({
  activeElement,
  onProcessingComplete,
}) => {
  const [status, setStatus] = useState<WidgetStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState<string>("");

  // Refs for race condition protection
  const isProcessingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeElementRef = useRef(activeElement);
  const isMountedRef = useRef(true);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  // Keep refs in sync
  useEffect(() => {
    activeElementRef.current = activeElement;
  }, [activeElement]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
      // Disconnect port on unmount
      if (portRef.current) {
        try {
          portRef.current.disconnect();
        } catch (e) {
          // Port may already be disconnected
        }
        portRef.current = null;
      }
    };
  }, []);

  // Floating UI positioning - bottom-right inside the input
  const { refs, floatingStyles, update } = useFloating({
    placement: "bottom-end",
    middleware: [
      // Negative offset to position inside the input element
      offset({ mainAxis: -36, crossAxis: -8 }),
      shift({ padding: 8 }),
    ],
  });

  // Update position when active element changes
  useEffect(() => {
    if (!activeElement) return;

    refs.setReference({
      getBoundingClientRect: (): DOMRect => {
        const rect = activeElement.getBoundingClientRect();
        // Anchor at the bottom-right corner of the input
        return {
          width: 0,
          height: 0,
          x: rect.right,
          y: rect.bottom,
          top: rect.bottom,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.right,
          toJSON: () => ({}),
        };
      },
    });

    const floatingElement = refs.floating.current;
    if (!floatingElement) return;

    const cleanup = autoUpdate(activeElement, floatingElement, update, {
      animationFrame: true, // Enable for smoother position updates
      ancestorScroll: true,
      ancestorResize: true,
      elementResize: true, // Track element resize
    });

    return cleanup;
  }, [activeElement, update, refs]);

  const isMounted = useCallback((): boolean => isMountedRef.current, []);

  const isExtensionContextValid = useCallback((): boolean => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-deprecated, @typescript-eslint/no-unnecessary-condition
      return typeof chrome !== "undefined" && chrome.runtime?.id != null;
    } catch {
      return false;
    }
  }, []);

  /**
   * Handles the sparkle button click with streaming support
   */
  const handleClick = useCallback(async (): Promise<void> => {
    if (isProcessingRef.current) return;

    if (!isExtensionContextValid()) {
      if (isMounted()) {
        setStatus("error");
        setMessage("Extension was reloaded. Please refresh this page.");
      }
      return;
    }

    const element = activeElementRef.current;
    if (!isElementValid(element)) {
      if (isMounted()) {
        setStatus("error");
        setMessage("No valid input element found");
      }
      return;
    }

    const currentText = getElementText(element);

    if (!currentText.trim()) {
      if (isMounted()) {
        setStatus("error");
        setMessage("Please enter some text first");
      }
      return;
    }

    // Set processing state
    isProcessingRef.current = true;
    if (isMounted()) {
      setStatus("processing");
      setMessage("Analyzing prompt...");
      setStreamedText("");
    }

    try {
      const platform = detectPlatform();
      if (isMounted()) setMessage(`Optimizing for ${platform}...`);

      // Open long-lived port for streaming
      const port = chrome.runtime.connect({ name: "optimize-port" });
      portRef.current = port;

      let fullOptimizedText = "";
      let appliedRulesCount = 0;

      // Set up port message listener for streaming chunks
      const handlePortMessage = (message: unknown): void => {
        if (!message || typeof message !== "object") return;

        const msg = message as Record<string, unknown>;

        if (msg.type === "CHUNK") {
          // Accumulate streamed text
          const chunk = msg.data as string;
          fullOptimizedText += chunk;
          if (isMounted()) {
            setStreamedText(fullOptimizedText);
            // Show character count as feedback
            setMessage(`Generating... (${fullOptimizedText.length} chars)`);
          }
        } else if (msg.type === "COMPLETE") {
          // Optimization complete
          const optimizedPrompt = msg.optimizedPrompt as string;
          const appliedRules = msg.appliedRules as string[];
          appliedRulesCount = appliedRules.length;

          // Replace text in the input
          void (async () => {
            if (isMounted()) setMessage("Updating text...");

            const currentElement = activeElementRef.current;
            if (!isElementValid(currentElement) || currentElement !== element) {
              if (isMounted()) {
                setStatus("error");
                setMessage("Target element changed during processing");
              }
              return;
            }

            const result = await replaceText(currentElement, optimizedPrompt);

            if (!result.success) {
              if (isMounted()) {
                setStatus("error");
                setMessage(result.error ?? "Failed to replace text");
              }
              return;
            }

            // Success
            if (isMounted()) {
              setStatus("success");
              setMessage(`Applied ${String(appliedRulesCount)} rules`);
            }

            // Clear success message after delay
            setTimeout(() => {
              if (isMounted()) {
                setStatus("idle");
                setMessage(null);
                setStreamedText("");
              }
            }, 2500);

            onProcessingComplete?.();
          })();
        } else if (msg.type === "ERROR") {
          // Error occurred
          const errorMessage = (msg.message as string) ?? "Optimization failed";
          if (isMounted()) {
            setStatus("error");
            setMessage(errorMessage);
          }
        }
      };

      port.onMessage.addListener(handlePortMessage);

      // Handle port disconnect
      port.onDisconnect.addListener(() => {
        if (isProcessingRef.current && isMounted()) {
          setStatus("error");
          setMessage("Connection lost during optimization");
        }
      });

      // Send optimization request
      port.postMessage({
        type: "START_OPTIMIZATION",
        draft: currentText,
        platform,
      });
    } catch (err) {
      console.error("[SparkleWidget] Error:", err);
      if (isMounted()) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [isMounted, onProcessingComplete, isExtensionContextValid]);

  // Clear error after delay
  useEffect(() => {
    if (status !== "error") {
      return;
    }

    const timer = setTimeout(() => {
      if (isMounted()) {
        setStatus("idle");
        setMessage(null);
      }
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [status, isMounted]);

  const combinedStyles = useMemo(
    () => ({
      ...floatingStyles,
      zIndex: 2147483647,
      pointerEvents: "auto" as const,
    }),
    [floatingStyles],
  );

  if (!activeElement) return null;

  return (
    <div
      ref={refs.setFloating}
      style={combinedStyles}
      className="sparkle-widget-container"
      role="tooltip"
      data-testid="prompt-tuner-widget"
    >
      <button
        onClick={() => {
          void handleClick();
        }}
        onMouseDown={(e) => {
          // Prevent focus loss from the input field
          e.preventDefault();
        }}
        disabled={status === "processing"}
        className={cn(
          "sparkle-button",
          status === "processing" && "animate-pulse",
        )}
        aria-label={
          status === "processing" ? "Processing..." : "Optimize prompt"
        }
        aria-busy={status === "processing"}
        type="button"
        data-testid="optimize-button"
      >
        {status === "processing" ? (
          <Wrench className="sparkle-button-icon animate-wiggle" />
        ) : status === "success" ? (
          <CheckCircle className="sparkle-button-icon text-green-400" data-testid="success-indicator" />
        ) : status === "error" ? (
          <AlertCircle className="sparkle-button-icon text-red-400" />
        ) : (
          <Wrench className="sparkle-button-icon" />
        )}
      </button>

      {message && (
        <div
          className={cn(
            status === "error" && "sparkle-error",
            status === "success" && "sparkle-success",
            status === "processing" && "sparkle-status",
          )}
          role={status === "error" ? "alert" : "status"}
          aria-live="polite"
          data-testid={status === "error" ? "error-message" : undefined}
        >
          {message}
          {/* Show streaming preview during processing */}
          {status === "processing" && streamedText && (
            <div 
              className="mt-2 text-xs opacity-75 max-h-20 overflow-y-auto"
              data-testid="streaming-preview"
            >
              {streamedText.slice(0, 100)}
              {streamedText.length > 100 && "..."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const MemoizedSparkleWidget = React.memo(SparkleWidget);
