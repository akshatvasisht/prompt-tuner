/**
 * Content Script Entry Point - Plasmo CSUI
 *
 * Injects the Sparkle Widget into LLM platform pages (ChatGPT, Claude, Gemini)
 * using Plasmo's Content Script UI pattern.
 *
 * Features:
 * - Focus tracking for text inputs
 * - MutationObserver for element removal detection
 * - SPA navigation handling
 * - Proper cleanup on unmount
 */

import cssText from "data-text:~styles/globals.css"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import { SparkleWidget } from "~components/sparkle-widget"
import { getActiveTextInput } from "~lib/dom-injector"
import { isSupportedPlatform } from "~lib/platform-detector"
import { throttle } from "~lib/utils"
import { type TextInputElement } from "~types"

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
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

// =============================================================================
// Type Guards
// =============================================================================

function isTextInputElement(element: EventTarget | Node | null): element is TextInputElement {
  if (!element || !(element instanceof HTMLElement)) return false

  if (element instanceof HTMLTextAreaElement) {
    return !element.disabled && !element.readOnly
  }

  if (element instanceof HTMLDivElement && element.contentEditable === "true") {
    return true
  }

  return false
}

function isElementInDOM(element: HTMLElement | null): boolean {
  return element !== null && document.body.contains(element)
}

// =============================================================================
// Sparkle Widget Overlay Component
// =============================================================================

const SparkleWidgetOverlay: React.FC = () => {
  const [activeElement, setActiveElement] = useState<TextInputElement | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const activeElementRef = useRef<TextInputElement | null>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mutationObserverRef = useRef<MutationObserver | null>(null)

  // Keep ref in sync
  useEffect(() => {
    activeElementRef.current = activeElement
  }, [activeElement])

  // Check platform support
  useEffect(() => {
    setIsSupported(isSupportedPlatform())
  }, [])

  // Clear any pending hide timeout
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  // Hide the widget with optional delay
  const hideWidget = useCallback(
    (delay = 0) => {
      clearHideTimeout()
      if (delay > 0) {
        hideTimeoutRef.current = setTimeout(() => {
          setActiveElement(null)
        }, delay)
      } else {
        setActiveElement(null)
      }
    },
    [clearHideTimeout]
  )

  // Show the widget for an element
  const showWidget = useCallback(
    (element: TextInputElement) => {
      clearHideTimeout()
      setActiveElement(element)
    },
    [clearHideTimeout]
  )

  // Observe element removal from DOM
  const observeElementRemoval = useCallback(
    (element: HTMLElement) => {
      mutationObserverRef.current?.disconnect()

      mutationObserverRef.current = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const removedNode of mutation.removedNodes) {
            if (
              removedNode === element ||
              (removedNode instanceof HTMLElement && removedNode.contains(element))
            ) {
              hideWidget()
              return
            }
          }
        }
      })

      mutationObserverRef.current.observe(document.body, {
        childList: true,
        subtree: true,
      })
    },
    [hideWidget]
  )

  // Setup event listeners
  useEffect(() => {
    if (!isSupported) return

    const handleFocusIn = (event: FocusEvent): void => {
      const target = event.target
      if (isTextInputElement(target)) {
        showWidget(target)
        observeElementRemoval(target)
      }
    }

    const handleClick = (event: MouseEvent): void => {
      const target = event.target

      if (isTextInputElement(target)) {
        showWidget(target)
        observeElementRemoval(target)
        return
      }

      // Check if clicking inside widget container (Plasmo overlay)
      if (target instanceof Node) {
        const plasmoContainer = (target as Element).closest?.("plasmo-csui")
        if (plasmoContainer) {
          return
        }
      }

      // Hide widget when clicking outside (if not on a text input)
      const currentActive = getActiveTextInput()
      if (!currentActive || !isTextInputElement(currentActive)) {
        hideWidget()
      }
    }

    const handleInput = throttle((event: Event): void => {
      const target = event.target
      if (isTextInputElement(target) && document.activeElement === target) {
        showWidget(target)
        observeElementRemoval(target)
      }
    }, 100)

    const handleBlur = (event: FocusEvent): void => {
      const target = event.target
      if (!isTextInputElement(target)) return

      // Use longer timeout to allow widget button clicks
      hideWidget(300)
    }

    const handleNavigation = (): void => {
      const current = activeElementRef.current
      if (current && !isElementInDOM(current)) {
        hideWidget()
      }
    }

    // Add listeners
    document.addEventListener("focusin", handleFocusIn, true)
    document.addEventListener("click", handleClick, true)
    document.addEventListener("input", handleInput, true)
    document.addEventListener("focusout", handleBlur, true)
    window.addEventListener("popstate", handleNavigation)
    window.addEventListener("hashchange", handleNavigation)

    // Check for already active input
    const currentActive = getActiveTextInput()
    if (currentActive && document.activeElement === currentActive) {
      showWidget(currentActive)
      observeElementRemoval(currentActive)
    }

    // Cleanup
    return () => {
      document.removeEventListener("focusin", handleFocusIn, true)
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("input", handleInput, true)
      document.removeEventListener("focusout", handleBlur, true)
      window.removeEventListener("popstate", handleNavigation)
      window.removeEventListener("hashchange", handleNavigation)
      mutationObserverRef.current?.disconnect()
      clearHideTimeout()
    }
  }, [isSupported, showWidget, hideWidget, observeElementRemoval, clearHideTimeout])

  // Don't render if not supported or no active element
  if (!isSupported || !activeElement) {
    return null
  }

  return <SparkleWidget activeElement={activeElement} />
}

export default SparkleWidgetOverlay
