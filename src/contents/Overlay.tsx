/* eslint-disable @typescript-eslint/no-deprecated */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command } from "~components/ui/Command";
import { Toaster } from "~components/ui/Toaster";
import { CommandPaletteContent } from "~components/PromptTunerOverlay";
import { MiniPillTrigger } from "~components/MiniPillTrigger";
import { useKeyboardShortcut } from "~hooks/use-keyboard-shortcut";
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";

import cssText from "data-text:~styles/globals.css";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
};

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");
  style.textContent = cssText;
  return style;
};

import { KEYBOARD_SHORTCUTS, MESSAGE_TYPES, WIDGET_IDS } from "~lib/constants";
import { getRulesForPlatform } from "~lib/platform-rules";
import { detectPlatform } from "~lib/platform-detector";
import { warmup, shutdown, isWarmed } from "~lib/ai-engine";
import { logger } from "~lib/logger";

import { ErrorBoundary } from "~components/ErrorBoundary";

function PromptTunerOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  useKeyboardShortcut(KEYBOARD_SHORTCUTS.TOGGLE_OVERLAY, () => {
    setIsOpen((prev) => !prev);
  });

  useEffect(() => {
    const handleMessage = (message: { type: string }) => {
      if (message.type === MESSAGE_TYPES.TOGGLE_OVERLAY) {
        setIsOpen((prev) => !prev);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

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

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const isTextarea = target.tagName === "TEXTAREA" || target.getAttribute("contenteditable") === "true";

      if (isTextarea && !isWarmed()) {
        const platform = detectPlatform();
        if (platform !== "unknown") {
          const rules = getRulesForPlatform(platform);
          logger.info(`Detected interaction on ${platform}, warming up AI engine...`);
          void warmup(rules);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("focusin", handleFocus); // focusin bubbles, focus doesn't

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("focusin", handleFocus);
      if (shutdownTimeout) clearTimeout(shutdownTimeout);
    };
  }, []);

  return (
    <div id={WIDGET_IDS.OVERLAY_CONTAINER}>
      <Toaster />
      <MiniPillTrigger onOpen={() => { setIsOpen(true); }} />
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[99998]"
              onClick={() => { setIsOpen(false); }}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-1/2 z-[99999] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 px-4 outline-none"
            >
              <div
                className="overflow-hidden rounded-[var(--pt-radius)] border border-[var(--pt-glass-border)] bg-[var(--pt-glass-bg)] shadow-[var(--pt-shadow)] [backdrop-filter:var(--pt-glass-blur)]"
                style={{ boxShadow: "var(--pt-shadow), var(--pt-inner-glow)" }}
              >
                <ErrorBoundary>
                  <Command className="bg-transparent">
                    <CommandPaletteContent onClose={() => { setIsOpen(false); }} />
                  </Command>
                </ErrorBoundary>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PromptTunerOverlay;
