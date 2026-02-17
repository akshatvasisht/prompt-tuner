import { useState, useCallback } from "react";

interface UseKeyboardListOptions {
  count: number;
  onSelect: (index: number) => void;
}

interface UseKeyboardListResult {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Manages keyboard navigation for an ARIA listbox widget.
 * Handles ArrowUp/Down, Home, End, and Enter to select items.
 *
 * @param count - Total number of items in the list
 * @param onSelect - Called with the index of the selected item on Enter
 * @returns Active index state, setter, and keydown handler
 */
export function useKeyboardList({ count, onSelect }: UseKeyboardListOptions): UseKeyboardListResult {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % count);
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => (i - 1 + count) % count);
          break;
        case "Home":
          e.preventDefault();
          setActiveIndex(0);
          break;
        case "End":
          e.preventDefault();
          setActiveIndex(count - 1);
          break;
        case "Enter":
          e.preventDefault();
          onSelect(activeIndex);
          break;
      }
    },
    [count, onSelect, activeIndex],
  );

  return { activeIndex, setActiveIndex, handleKeyDown };
}
