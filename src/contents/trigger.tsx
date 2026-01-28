/**
 * Trigger Button - Minimal floating button to open side panel
 *
 * Features:
 * - Appears when supported textarea is focused
 * - CSS animation-based element detection
 * - Floating button on right edge
 * - Opens side panel with draft text
 * - Stores active element reference for injection
 */

import cssText from "data-text:~styles/globals.css";
import type {
  PlasmoCSConfig,
  PlasmoGetStyle,
  PlasmoRender,
  PlasmoCSUIProps,
} from "plasmo";
import { createRoot } from "react-dom/client";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Wrench } from "lucide-react";
import { cn } from "~lib/utils";
import {
  detectPlatform,
  getPlatformInputSelectors,
  isSupportedPlatform,
} from "~lib/platform-detector";
import { getElementText, isElementValid } from "~lib/dom-injector";
import { observeElements } from "~lib/element-observer";
import { type TextInputElement } from "~types";

// =============================================================================
// Plasmo Configuration
// =============================================================================

export const config: PlasmoCSConfig = {
  matches: [
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://bard.google.com/*",
    "https://gemini.google.com/*",
  ],
};

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");
  style.textContent = cssText;
  return style;
};

// =============================================================================
// Custom Mount - Manual Root Creation
// =============================================================================

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export const render: PlasmoRender<PlasmoCSUIProps> = async ({
  createRootContainer,
}) => {
  const rootContainer = await createRootContainer();
  const root = createRoot(rootContainer);
  root.render(<TriggerButton />);
};
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

// =============================================================================
// Type Guards
// =============================================================================

function isTextInputElement(
  element: EventTarget | Node | null,
): element is TextInputElement {
  if (!element || !(element instanceof HTMLElement)) return false;

  if (element instanceof HTMLTextAreaElement) {
    return !element.disabled && !element.readOnly;
  }

  if (element instanceof HTMLDivElement && element.contentEditable === "true") {
    return true;
  }

  return false;
}

// =============================================================================
// Storage for Active Element Reference
// =============================================================================

let activeElementRef: WeakRef<TextInputElement> | null = null;

function storeActiveElement(element: TextInputElement): void {
  activeElementRef = new WeakRef(element);
}

function getStoredElement(): TextInputElement | null {
  return activeElementRef?.deref() ?? null;
}

// =============================================================================
// Message Handler for Text Injection
// =============================================================================

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "INJECT_TEXT") {
    const text = message.text as string;
    const element = getStoredElement();

    if (!isElementValid(element)) {
      sendResponse({ success: false, error: "Element no longer valid" });
      return true;
    }

    // Import replaceText dynamically to avoid circular deps
    import("~lib/dom-injector")
      .then(({ replaceText }) => replaceText(element, text))
      .then((result) => {
        sendResponse(result);
      })
      .catch((error: unknown) => {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });

    return true; // Keep channel open for async response
  }
});
/* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

// =============================================================================
// Trigger Button Component
// =============================================================================

const TriggerButton: React.FC = () => {
  const [activeElement, setActiveElement] = useState<TextInputElement | null>(
    null,
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const observerControllerRef = useRef<AbortController | null>(null);

  // =============================================================================
  // Element Detection with CSS Animation Observer
  // =============================================================================

  useEffect(() => {
    if (!isSupportedPlatform()) {
      return;
    }

    const platform = detectPlatform();
    const selectors = getPlatformInputSelectors(platform);

    // Create abort controller for cleanup
    const controller = new AbortController();
    observerControllerRef.current = controller;

    // Observe all platform-specific selectors
    for (const selector of selectors) {
      observeElements(
        selector,
        (element) => {
          // Element appeared in DOM
          if (isTextInputElement(element)) {
            // Store reference for potential injection later
            storeActiveElement(element);

            // Show trigger if this element becomes focused
            const handleFocus = (): void => {
              setActiveElement(element);
              storeActiveElement(element);
            };

            const handleBlur = (): void => {
              // Delay hide to allow button click
              setTimeout(() => {
                if (document.activeElement !== element) {
                  setActiveElement(null);
                }
              }, 200);
            };

            element.addEventListener("focus", handleFocus);
            element.addEventListener("blur", handleBlur);

            // Clean up on element removal or abort
            controller.signal.addEventListener("abort", () => {
              element.removeEventListener("focus", handleFocus);
              element.removeEventListener("blur", handleBlur);
            });

            // Check if already focused
            if (document.activeElement === element) {
              setActiveElement(element);
            }
          }
        },
        controller.signal,
      );
    }

    return () => {
      controller.abort();
      observerControllerRef.current = null;
    };
  }, []);

  // =============================================================================
  // Click Handler - Open Side Panel
  // =============================================================================

  const handleClick = useCallback(async (): Promise<void> => {
    if (!activeElement || isProcessing) return;

    setIsProcessing(true);

    try {
      const currentText = getElementText(activeElement);

      if (!currentText.trim()) {
        console.warn("[Trigger] No text in active element");
        setIsProcessing(false);
        return;
      }

      const platform = detectPlatform();

      // Get current tab ID
      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTabId = tabs[0]?.id;
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

      if (!currentTabId) {
        console.error("[Trigger] Could not get current tab ID");
        setIsProcessing(false);
        return;
      }

      // Store draft in session storage
      /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
      await chrome.storage.session.set({
        currentDraft: {
          draftText: currentText,
          sourceTabId: currentTabId,
          platform,
          timestamp: Date.now(),
        },
      });

      // Send message to background to open side panel
      chrome.runtime.sendMessage(
        {
          type: "OPEN_SIDE_PANEL",
        },
        /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
        (_response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "[Trigger] Failed to open side panel:",
              chrome.runtime.lastError,
            );
          }

          setIsProcessing(false);
        },
      );
    } catch (error) {
      console.error("[Trigger] Error:", error);
      setIsProcessing(false);
    }
  }, [activeElement, isProcessing]);

  // Don't render if no active element
  if (!activeElement) {
    return null;
  }

  return (
    <div
      className="fixed z-[2147483647]"
      style={{
        right: "16px",
        bottom: "80px",
        pointerEvents: "auto",
      }}
    >
      <button
        data-testid="trigger-button"
        onClick={() => void handleClick()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
        disabled={isProcessing}
        className={cn(
          "flex items-center gap-2 px-3 py-2",
          "bg-primary text-black font-semibold",
          "border-2 border-black shadow-[4px_4px_0px_0px_#000000]",
          "hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px]",
          "active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
          "transition-all duration-100",
          "rounded",
          "cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          isProcessing && "animate-pulse",
        )}
        aria-label="Open Prompt Tuner"
        title="Optimize your prompt with AI"
        type="button"
      >
        <Wrench
          className={cn("w-4 h-4", isProcessing && "animate-wiggle")}
        />
        {(isHovered || isProcessing) && (
          <span className="text-sm whitespace-nowrap">
            {isProcessing ? "Opening..." : "Tune"}
          </span>
        )}
      </button>
    </div>
  );
};

export default TriggerButton;
