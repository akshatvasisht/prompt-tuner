import { useState, useEffect } from "react";

/**
 * Tracks whether the user currently has non-empty text selected on the page.
 * Debounced via requestAnimationFrame so rapid selectionchange bursts collapse
 * to at most one state update per frame.
 *
 * Callers that need the selection geometry should read it themselves via
 * `window.getSelection()` inside their own rAF loop - piping a rect through
 * React state just to mutate a transform would cause needless re-renders.
 */
export function useTextSelection(): { hasSelection: boolean } {
  const [hasSelection, setHasSelection] = useState(false);

  useEffect(() => {
    let rafId: number | null = null;

    const handleSelectionChange = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();
        setHasSelection(Boolean(selectedText && selectedText.length > 0));
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return { hasSelection };
}
