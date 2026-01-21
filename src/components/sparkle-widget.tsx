/**
 * Sparkle Widget - Floating optimization button
 *
 * Features:
 * - Floating UI positioning near active input
 * - Loading/error/success states
 * - Race condition protection
 * - AbortController for cancellable operations
 */

import * as React from "react"
import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useFloating, autoUpdate, offset, flip, shift } from "@floating-ui/react"
import { sendToBackground } from "@plasmohq/messaging"
import { Sparkles, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { replaceText, isElementValid, getElementText } from "~lib/dom-injector"
import { detectPlatform } from "~lib/platform-detector"
import { cn } from "~lib/utils"
import { type OptimizeRequest, type OptimizeResponse, type TextInputElement } from "~types"
import "../styles/globals.css"

// =============================================================================
// Types
// =============================================================================

interface SparkleWidgetProps {
  activeElement: TextInputElement | null
  onProcessingComplete?: () => void
}

type WidgetStatus = "idle" | "processing" | "success" | "error"

// =============================================================================
// Sparkle Widget Component
// =============================================================================

export const SparkleWidget: React.FC<SparkleWidgetProps> = ({
  activeElement,
  onProcessingComplete,
}) => {
  const [status, setStatus] = useState<WidgetStatus>("idle")
  const [message, setMessage] = useState<string | null>(null)

  // Refs for race condition protection
  const isProcessingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const activeElementRef = useRef(activeElement)
  const isMountedRef = useRef(true)

  // Keep refs in sync
  useEffect(() => {
    activeElementRef.current = activeElement
  }, [activeElement])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  // Floating UI positioning
  const { refs, floatingStyles, update } = useFloating({
    placement: "top-end",
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  })

  // Update position when active element changes
  useEffect(() => {
    if (!activeElement) return

    refs.setReference({
      getBoundingClientRect: (): DOMRect => {
        const rect = activeElement.getBoundingClientRect()
        return {
          width: 0,
          height: 0,
          x: rect.right,
          y: rect.top,
          top: rect.top,
          right: rect.right,
          bottom: rect.top,
          left: rect.right,
          toJSON: () => ({}),
        }
      },
    })

    const floatingElement = refs.floating.current
    if (!floatingElement) return

    const cleanup = autoUpdate(activeElement, floatingElement, update, {
      animationFrame: false,
      ancestorScroll: true,
      ancestorResize: true,
      elementResize: false,
    })

    return cleanup
  }, [activeElement, update, refs])

  const isMounted = useCallback((): boolean => isMountedRef.current, [])

  const isExtensionContextValid = useCallback((): boolean => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-deprecated, @typescript-eslint/no-unnecessary-condition
      return typeof chrome !== "undefined" && chrome.runtime?.id != null
    } catch {
      return false
    }
  }, [])

  /**
   * Handles the sparkle button click
   */
  const handleClick = useCallback(async (): Promise<void> => {
    if (isProcessingRef.current) return

    if (!isExtensionContextValid()) {
      if (isMounted()) {
        setStatus("error")
        setMessage("Extension was reloaded. Please refresh this page.")
      }
      return
    }

    const element = activeElementRef.current
    if (!isElementValid(element)) {
      if (isMounted()) {
        setStatus("error")
        setMessage("No valid input element found")
      }
      return
    }

    const currentText = getElementText(element)

    if (!currentText.trim()) {
      if (isMounted()) {
        setStatus("error")
        setMessage("Please enter some text first")
      }
      return
    }

    // Set processing state
    isProcessingRef.current = true
    if (isMounted()) {
      setStatus("processing")
      setMessage("Analyzing prompt...")
    }

    // Create AbortController
    abortControllerRef.current?.abort()
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const platform = detectPlatform()
      if (isMounted()) setMessage(`Optimizing for ${platform}...`)

      const request: OptimizeRequest = {
        draft: currentText,
        platform,
      }

      const response = await sendToBackground<OptimizeRequest, OptimizeResponse>({
        name: "optimize",
        body: request,
      })

      if (abortController.signal.aborted) return

      // Re-validate element
      const currentElement = activeElementRef.current
      if (!isElementValid(currentElement) || currentElement !== element) {
        if (isMounted()) {
          setStatus("error")
          setMessage("Target element changed during processing")
        }
        return
      }

      if (!response.success) {
        const errorMessage = response.error?.message ?? "Optimization failed"
        if (isMounted()) {
          setStatus("error")
          setMessage(errorMessage)
        }
        return
      }

      // Replace text
      if (isMounted()) setMessage("Updating text...")
      const result = replaceText(currentElement, response.optimizedPrompt)

      if (!result.success) {
        if (isMounted()) {
          setStatus("error")
          setMessage(result.error ?? "Failed to replace text")
        }
        return
      }

      // Success
      const rulesCount = response.appliedRules.length
      if (isMounted()) {
        setStatus("success")
        setMessage(`Applied ${String(rulesCount)} rules`)
      }

      // Clear success message after delay
      setTimeout(() => {
        if (isMounted()) {
          setStatus("idle")
          setMessage(null)
        }
      }, 2500)

      onProcessingComplete?.()
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return

      if (err instanceof Error && err.message.includes("Extension context invalidated")) {
        if (isMounted()) {
          setStatus("error")
          setMessage("Extension was reloaded. Please refresh.")
        }
        return
      }

      console.error("[SparkleWidget] Error:", err)
      if (isMounted()) {
        setStatus("error")
        setMessage(err instanceof Error ? err.message : "Unknown error")
      }
    } finally {
      isProcessingRef.current = false
    }
  }, [isMounted, onProcessingComplete, isExtensionContextValid])

  // Clear error after delay
  useEffect(() => {
    if (status === "error") {
      const timer = setTimeout(() => {
        if (isMounted()) {
          setStatus("idle")
          setMessage(null)
        }
      }, 4000)
      return () => {
        clearTimeout(timer)
      }
    }
  }, [status, isMounted])

  const combinedStyles = useMemo(
    () => ({
      ...floatingStyles,
      zIndex: 2147483647,
      pointerEvents: "auto" as const,
    }),
    [floatingStyles]
  )

  if (!activeElement) return null

  return (
    <div
      ref={refs.setFloating}
      style={combinedStyles}
      className="sparkle-widget-container"
      role="tooltip"
    >
      <button
        onClick={() => {
          void handleClick()
        }}
        disabled={status === "processing"}
        className={cn(
          "sparkle-button",
          status === "processing" && "animate-pulse"
        )}
        aria-label={status === "processing" ? "Processing..." : "Optimize prompt"}
        aria-busy={status === "processing"}
        type="button"
      >
        {status === "processing" ? (
          <Loader2 className="sparkle-button-icon animate-spin" />
        ) : status === "success" ? (
          <CheckCircle className="sparkle-button-icon text-green-400" />
        ) : status === "error" ? (
          <AlertCircle className="sparkle-button-icon text-red-400" />
        ) : (
          <Sparkles className="sparkle-button-icon" />
        )}
      </button>

      {message && (
        <div
          className={cn(
            status === "error" && "sparkle-error",
            status === "success" && "sparkle-success",
            status === "processing" && "sparkle-status"
          )}
          role={status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {message}
        </div>
      )}
    </div>
  )
}

export const MemoizedSparkleWidget = React.memo(SparkleWidget)
