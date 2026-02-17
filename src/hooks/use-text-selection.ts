import { useState, useEffect } from "react";

export interface SelectionRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function useTextSelection(): {
  hasSelection: boolean;
  selectionRect: SelectionRect | null;
} {
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
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
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  return { hasSelection, selectionRect };
}
