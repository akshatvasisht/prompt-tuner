/**
 * Element Observer - CSS animation-based element detection
 *
 * This pattern is more performant than MutationObserver for detecting
 * when matching elements appear in the DOM.
 *
 * Inspired by refined-github's element observer pattern.
 * Logic only - no code copied.
 *
 * How it works:
 * 1. Inject CSS animation keyframe and apply to matching elements
 * 2. Listen for animationstart events
 * 3. Mark elements as seen to avoid duplicate callbacks
 * 4. Clean up with AbortSignal when done
 */

// =============================================================================
// Constants
// =============================================================================

const ANIMATION_NAME = "prompt-tuner-observer";
const STYLE_ID = "prompt-tuner-observer-style";
const SEEN_CLASS = "pt-seen";

// =============================================================================
// Public API
// =============================================================================

/**
 * Observes elements matching a selector using CSS animation detection
 *
 * @param selector - CSS selector to match elements
 * @param callback - Function to call when matching elements appear
 * @param signal - Optional AbortSignal for cleanup
 *
 * @example
 * ```typescript
 * const controller = new AbortController();
 * 
 * observeElements(
 *   'textarea[placeholder*="Message"]',
 *   (element) => {
 *     console.log('Textarea appeared:', element);
 *   },
 *   controller.signal
 * );
 * 
 * // Later: cleanup
 * controller.abort();
 * ```
 */
export function observeElements(
  selector: string,
  callback: (element: HTMLElement) => void,
  signal?: AbortSignal,
): void {
  // Check if already aborted
  if (signal?.aborted) {
    return;
  }

  // Inject CSS animation if not already present
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes ${ANIMATION_NAME} {
        /* Empty keyframe - just triggers animationstart event */
      }
      
      /* Apply animation to matching elements that haven't been seen */
      :where(${selector}):not(.${SEEN_CLASS}) {
        animation: 1ms ${ANIMATION_NAME};
      }
    `;

    document.head.appendChild(style);
  }

  // Handler for animationstart events
  const handleAnimationStart = (event: AnimationEvent): void => {
    // Check if this is our animation
    if (event.animationName !== ANIMATION_NAME) {
      return;
    }

    const element = event.target;

    // Validate element is an HTMLElement
    if (!(element instanceof HTMLElement)) {
      return;
    }

    // Mark as seen to avoid duplicate callbacks
    element.classList.add(SEEN_CLASS);

    // Call the callback
    try {
      callback(element);
    } catch (error) {
      console.error("[ElementObserver] Callback error:", error);
    }
  };

  // Add event listener with capture phase for better performance
  document.addEventListener("animationstart", handleAnimationStart, {
    capture: true,
    signal,
  });

  // Check for elements that already exist in the DOM
  // These won't trigger animationstart since they're already rendered
  const existingElements = document.querySelectorAll(
    `${selector}:not(.${SEEN_CLASS})`,
  );

  existingElements.forEach((element) => {
    if (element instanceof HTMLElement) {
      element.classList.add(SEEN_CLASS);
      try {
        callback(element);
      } catch (error) {
        console.error("[ElementObserver] Callback error:", error);
      }
    }
  });

  // Cleanup function if signal is provided
  if (signal) {
    signal.addEventListener("abort", () => {
      // Remove style if no other observers are active
      const style = document.getElementById(STYLE_ID);
      if (style && !signal.aborted) {
        // Only remove if we're the last observer
        // In practice, we keep the style for simplicity
      }
    });
  }
}

/**
 * Observes elements and removes them when they're clicked outside
 *
 * @param selector - CSS selector to match elements
 * @param onAppear - Function to call when element appears
 * @param onDisappear - Function to call when element should disappear
 * @param signal - Optional AbortSignal for cleanup
 */
export function observeWithClickOutside(
  selector: string,
  onAppear: (element: HTMLElement) => void,
  onDisappear: (element: HTMLElement) => void,
  signal?: AbortSignal,
): void {
  const activeElements = new Set<HTMLElement>();

  // Observe element appearances
  observeElements(
    selector,
    (element) => {
      activeElements.add(element);
      onAppear(element);
    },
    signal,
  );

  // Handle click outside
  const handleClick = (event: MouseEvent): void => {
    const target = event.target as Node;

    activeElements.forEach((element) => {
      // Check if click is outside this element
      if (!element.contains(target)) {
        activeElements.delete(element);
        onDisappear(element);
      }
    });
  };

  document.addEventListener("click", handleClick, {
    capture: true,
    signal,
  });
}

/**
 * Creates an AbortController that can be used to stop observing
 *
 * @returns AbortController for cleanup
 *
 * @example
 * ```typescript
 * const observer = createObserverController();
 * 
 * observeElements('textarea', callback, observer.signal);
 * 
 * // Stop observing
 * observer.abort();
 * ```
 */
export function createObserverController(): AbortController {
  return new AbortController();
}

/**
 * Clears all seen markers from elements
 * Useful for testing or when you want elements to be re-observed
 *
 * @param selector - Optional selector to clear specific elements
 */
export function clearSeenMarkers(selector?: string): void {
  const elements = selector
    ? document.querySelectorAll(`${selector}.${SEEN_CLASS}`)
    : document.querySelectorAll(`.${SEEN_CLASS}`);

  elements.forEach((element) => {
    element.classList.remove(SEEN_CLASS);
  });
}
