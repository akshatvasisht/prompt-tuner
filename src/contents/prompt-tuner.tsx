/**
 * Content Script Entry Point - Plasmo CSUI with Overlay Anchor
 *
 * Injects the Sparkle Widget into LLM platform pages (ChatGPT, Claude, Gemini)
 * using Plasmo's official overlay anchor pattern for automatic lifecycle management.
 *
 * Plasmo Features Used:
 * - getOverlayAnchor: Automatic mounting when anchor element is visible
 * - Built-in MutationObserver: Plasmo watches DOM for anchor changes
 * - Shadow DOM isolation: Automatic style encapsulation
 *
 * Custom Features:
 * - Focus tracking: Show widget only for focused text inputs
 * - Click-outside detection: Hide widget when clicking outside
 * - SPA navigation handling: Cleanup on route changes
 */

import cssText from "data-text:~styles/globals.css";
import type {
  PlasmoCSConfig,
  PlasmoGetOverlayAnchor,
  PlasmoGetStyle,
} from "plasmo";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { SparkleWidget } from "~components/sparkle-widget";
import { getActiveTextInput } from "~lib/dom-injector";
import {
  detectPlatform,
  getPlatformInputSelectors,
  isSupportedPlatform,
} from "~lib/platform-detector";
import { throttle } from "~lib/utils";
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

/**
 * Plasmo Overlay Anchor - Returns the first text input on the page
 * Plasmo will automatically mount/unmount the overlay based on anchor visibility
 */
export const getOverlayAnchor: PlasmoGetOverlayAnchor = async () => {
  // Wait for platform detection
  if (!isSupportedPlatform()) {
    return null;
  }

  // Get platform-specific selectors
  const platform = detectPlatform();
  const selectors = getPlatformInputSelectors(platform);

  // Find the first matching input element
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element as Element;
    }
  }

  // Fallback: look for any common text input
  const fallback = document.querySelector(
    'textarea, div[contenteditable="true"]',
  );
  return fallback;
};

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
// Sparkle Widget Overlay Component
// =============================================================================

const SparkleWidgetOverlay: React.FC = () => {
  const [activeElement, setActiveElement] = useState<TextInputElement | null>(
    null,
  );
  const activeElementRef = useRef<TextInputElement | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep ref in sync
  useEffect(() => {
    activeElementRef.current = activeElement;
  }, [activeElement]);

  // Clear any pending hide timeout
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Hide the widget with optional delay
  const hideWidget = useCallback(
    (delay = 0) => {
      clearHideTimeout();
      if (delay > 0) {
        hideTimeoutRef.current = setTimeout(() => {
          setActiveElement(null);
        }, delay);
      } else {
        setActiveElement(null);
      }
    },
    [clearHideTimeout],
  );

  // Show the widget for an element
  const showWidget = useCallback(
    (element: TextInputElement) => {
      clearHideTimeout();
      setActiveElement(element);
    },
    [clearHideTimeout],
  );

  // Setup event listeners for focus tracking
  useEffect(() => {
    const handleFocusIn = (event: FocusEvent): void => {
      const target = event.target;
      if (isTextInputElement(target)) {
        showWidget(target);
      }
    };

    const handleClick = (event: MouseEvent): void => {
      const target = event.target;

      if (isTextInputElement(target)) {
        showWidget(target);
        return;
      }

      // Check if clicking inside widget container (Plasmo overlay)
      if (target instanceof Node) {
        const plasmoContainer = (target as Element).closest?.("plasmo-csui");
        if (plasmoContainer) {
          return;
        }
      }

      // Hide widget when clicking outside (if not on a text input)
      const currentActive = getActiveTextInput();
      if (!currentActive || !isTextInputElement(currentActive)) {
        hideWidget();
      }
    };

    const handleInput = throttle((event: Event): void => {
      const target = event.target;
      if (isTextInputElement(target) && document.activeElement === target) {
        showWidget(target);
      }
    }, 100);

    const handleBlur = (event: FocusEvent): void => {
      const target = event.target;
      if (!isTextInputElement(target)) return;

      // Use longer timeout to allow widget button clicks
      hideWidget(300);
    };

    // Add listeners
    document.addEventListener("focusin", handleFocusIn, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("input", handleInput, true);
    document.addEventListener("focusout", handleBlur, true);

    // Check for already active input on mount
    const currentActive = getActiveTextInput();
    if (currentActive && document.activeElement === currentActive) {
      showWidget(currentActive);
    }

    // Cleanup
    return () => {
      document.removeEventListener("focusin", handleFocusIn, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("input", handleInput, true);
      document.removeEventListener("focusout", handleBlur, true);
      clearHideTimeout();
    };
  }, [showWidget, hideWidget, clearHideTimeout]);

  // Don't render if no active element
  if (!activeElement) {
    return null;
  }

  return (
    <div data-testid="widget-container">
      <SparkleWidget activeElement={activeElement} />
    </div>
  );
};

export default SparkleWidgetOverlay;
