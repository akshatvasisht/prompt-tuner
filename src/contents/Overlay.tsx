/* eslint-disable @typescript-eslint/no-deprecated */
import { useCallback, useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Toaster } from "~components/ui/Toaster";
import { CommandPaletteContent } from "~components/PromptTunerOverlay";
import { SelectionTrigger } from "~components/SelectionTrigger";
import { useKeyboardShortcut } from "~hooks/use-keyboard-shortcut";
import type { PlasmoCSConfig, PlasmoGetRootContainer } from "plasmo";

import "@fontsource-variable/inter";
import cssText from "data-text:~styles/globals.css";

export const config: PlasmoCSConfig = {
  matches: [
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://bard.google.com/*",
    "https://gemini.google.com/*",
  ],
};

/**
 * Mount overlay directly to document.body (outside Shadow DOM).
 * Style isolation is achieved via the `--pt-*` CSS variable prefix,
 * not shadow encapsulation - see CLAUDE.md gotcha #1.
 */
export const getRootContainer: PlasmoGetRootContainer = () => {
  const container = document.createElement("div");
  container.id = "prompt-tuner-root";
  document.body.appendChild(container);

  // Inject CSS variables + extension styles into main document - guarded so
  // HMR re-invocations don't stack duplicate <style> blocks in <head>.
  if (!document.getElementById("prompt-tuner-styles")) {
    const ptStyle = document.createElement("style");
    ptStyle.id = "prompt-tuner-styles";
    ptStyle.textContent = cssText;
    document.head.appendChild(ptStyle);
  }

  return container;
};

import {
  KEYBOARD_SHORTCUTS,
  MESSAGE_TYPES,
  WIDGET_IDS,
  STORAGE_KEYS,
} from "~lib/constants";
import { getRulesForPlatform } from "~lib/platform-rules";
import { detectPlatform } from "~lib/platform-detector";
import { warmup, shutdown, isWarmed } from "~lib/ai-engine";
import { getSelectedText } from "~lib/text-replacer";
import { observeElements } from "~lib/element-observer";
import { PLATFORM_INPUT_SELECTORS } from "~lib/platforms";

import { ErrorBoundary } from "~components/ErrorBoundary";

function PromptTunerOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const hasWarmedRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Open / close helpers with focus management (F9)
  // ---------------------------------------------------------------------------

  const openOverlay = useCallback(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    setIsOpen(true);
  }, []);

  const closeOverlay = useCallback(() => {
    setIsOpen(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Run on Open: if enabled, bypass palette and run default action immediately
  // ---------------------------------------------------------------------------

  const handleRunOnOpen = useCallback(async () => {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.DEFAULT_ACTION,
      STORAGE_KEYS.RUN_ON_OPEN,
    ]);

    const defaultAction = result[STORAGE_KEYS.DEFAULT_ACTION] as
      | string
      | undefined;
    const runOnOpenEnabled = result[STORAGE_KEYS.RUN_ON_OPEN] as
      | boolean
      | undefined;

    if (runOnOpenEnabled && defaultAction) {
      const selectedText = getSelectedText();
      if (selectedText?.trim()) {
        // Open directly into streaming mode - the CommandPaletteContent
        // will receive the action via props and start streaming
        openOverlay();
        return true; // Signal event handled
      }
    }

    return false; // fall through to normal open
  }, [openOverlay]);

  // ---------------------------------------------------------------------------
  // Keyboard shortcut
  // ---------------------------------------------------------------------------

  useKeyboardShortcut(KEYBOARD_SHORTCUTS.TOGGLE_OVERLAY, () => {
    // Warm on first shortcut press - hides 2–3s cold start behind user intent
    if (!hasWarmedRef.current && !isWarmed()) {
      hasWarmedRef.current = true;
      const platform = detectPlatform();
      if (platform !== "unknown") {
        void warmup(getRulesForPlatform(platform));
      }
    }

    if (isOpen) {
      closeOverlay();
    } else {
      void handleRunOnOpen().then((handled) => {
        if (!handled) openOverlay();
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Proactive warmup when the host platform's input element appears in the DOM.
  // Beats the cold-start latency on the first ⌘⇧K press by ~150ms - the model
  // is already loaded by the time the user makes a selection. Guarded by
  // hasWarmedRef so the SW only spins up a base session once per content-script
  // lifetime.
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const platform = detectPlatform();
    if (platform === "unknown") return;
    if (hasWarmedRef.current) return;

    const controller = new AbortController();
    const triggerWarm = () => {
      if (hasWarmedRef.current || isWarmed()) return;
      hasWarmedRef.current = true;
      controller.abort();
      void warmup(getRulesForPlatform(platform));
    };

    for (const selector of PLATFORM_INPUT_SELECTORS[platform]) {
      observeElements(selector, triggerWarm, controller.signal);
    }

    return () => {
      controller.abort();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Message listener (toggle overlay from background)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleMessage = (message: { type: string }) => {
      if (message.type === MESSAGE_TYPES.TOGGLE_OVERLAY) {
        if (isOpen) {
          closeOverlay();
        } else {
          openOverlay();
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [isOpen, openOverlay, closeOverlay]);

  // ---------------------------------------------------------------------------
  // SW Liveness: Keep background service worker alive while overlay is open
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    const pingInterval = setInterval(() => {
      chrome.runtime.sendMessage({ type: MESSAGE_TYPES.PING }).catch(() => {
        /* ignore */
      });
    }, 15000); // Send ping every 15 seconds

    return () => {
      clearInterval(pingInterval);
    };
  }, [isOpen]);

  // ---------------------------------------------------------------------------
  // Body class toggle
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("prompt-tuner-overlay-open");
    } else {
      document.body.classList.remove("prompt-tuner-overlay-open");
    }
    return () => {
      document.body.classList.remove("prompt-tuner-overlay-open");
    };
  }, [isOpen]);

  // ===========================================================================
  // Smart Lifecycle Management
  // ===========================================================================

  useEffect(() => {
    let shutdownTimeout: NodeJS.Timeout | null = null;
    const GRACE_PERIOD_MS = 10000; // 10s grace period for re-entry

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Start grace period before shutdown
        shutdownTimeout = setTimeout(() => {
          shutdown();
        }, GRACE_PERIOD_MS);
      } else {
        // Cancel shutdown if user returns within grace period
        if (shutdownTimeout) {
          clearTimeout(shutdownTimeout);
          shutdownTimeout = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (shutdownTimeout) clearTimeout(shutdownTimeout);
    };
  }, []);

  return (
    <TooltipPrimitive.Provider delayDuration={600}>
      <div id={WIDGET_IDS.OVERLAY_CONTAINER}>
        <Toaster />
        <SelectionTrigger onOpen={openOverlay} />
        <DialogPrimitive.Root
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) closeOverlay();
          }}
        >
          {isOpen && (
            <>
              {/* Ink scrim - no blur, quiet dim */}
              <div
                className="pt-backdrop fixed inset-0 z-[var(--pt-z-backdrop)]"
                style={{ backgroundColor: "rgba(17, 16, 16, 0.15)" }}
                onClick={closeOverlay}
                aria-hidden
              />
              {/* Dialog - Radix FocusTrap via asChild */}
              <DialogPrimitive.Content
                asChild
                onEscapeKeyDown={(e) => {
                  e.preventDefault();
                  closeOverlay();
                }}
                onCloseAutoFocus={(e) => {
                  e.preventDefault();
                  previouslyFocused.current?.focus();
                  previouslyFocused.current = null;
                }}
                aria-label="Prompt Tuner"
              >
                <div
                  ref={overlayRef}
                  className="pt-dialog-motion fixed left-1/2 top-1/2 z-[var(--pt-z-dialog)] w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4 outline-none"
                >
                  <div
                    className="overflow-hidden rounded-[var(--pt-radius-lg)] border border-[var(--pt-surface-border)] bg-[var(--pt-surface)]"
                    style={{
                      boxShadow: "var(--pt-shadow-lg)",
                    }}
                  >
                    <ErrorBoundary>
                      <div className="flex h-full w-full flex-col overflow-hidden">
                        <CommandPaletteContent onClose={closeOverlay} />
                      </div>
                    </ErrorBoundary>
                  </div>
                </div>
              </DialogPrimitive.Content>
            </>
          )}
        </DialogPrimitive.Root>
      </div>
    </TooltipPrimitive.Provider>
  );
}

export default PromptTunerOverlay;
