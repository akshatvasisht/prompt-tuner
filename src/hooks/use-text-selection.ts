import { useState, useEffect } from "react";

export interface SelectionRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Tracks the user's text selection on the page, debounced via requestAnimationFrame.
 * Reports whether text is selected and the bounding rect of the selection.
 *
 * @returns `hasSelection` — whether non-empty text is currently selected,
 *          `selectionRect` — viewport-relative bounding rect, or null when nothing is selected
 */
export function useTextSelection(): {
  hasSelection: boolean;
  selectionRect: SelectionRect | null;
} {
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(
    null,
  );

  useEffect(() => {
    let rafId: number | null = null;

    const handleSelectionChange = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 0) {
          const range = selection?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();

          if (rect) {
            setHasSelection(true);
            setSelectionRect({
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            });
          }
        } else {
          setHasSelection(false);
          setSelectionRect(null);
        }
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return { hasSelection, selectionRect };
}
