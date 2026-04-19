import { useCallback, useEffect, useRef, useState } from "react";
import { WIDGET_IDS } from "~lib/constants";
import { useTextSelection } from "~hooks/use-text-selection";
import { Tooltip } from "~components/ui/Tooltip";
import { Logo } from "~components/Logo";
import { formatShortcut } from "~lib/platform-shortcut";

const PILL_OFFSET = 40;
const VIEWPORT_PADDING = 8;
const PILL_HALF_WIDTH = 22;

export interface SelectionTriggerProps {
  onOpen: () => void;
}

export function SelectionTrigger({ onOpen }: SelectionTriggerProps) {
  const { hasSelection } = useTextSelection();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissal whenever the underlying selection changes - Notion-style:
  // ESC hides the pill but doesn't clear the selection; making a *new*
  // selection brings the pill back without forcing the user to scroll/click.
  useEffect(() => {
    setDismissed(false);
  }, [hasSelection]);

  // ESC dismiss - listens at document level since the pill never has focus
  // by default (selection lives in the host page).
  useEffect(() => {
    if (!hasSelection || dismissed) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDismissed(true);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasSelection, dismissed]);

  const updatePosition = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    const preferredY = rect.top - PILL_OFFSET;
    const clippedTop = preferredY < VIEWPORT_PADDING;
    const y = clippedTop ? rect.bottom + VIEWPORT_PADDING : preferredY;
    const minX = VIEWPORT_PADDING + PILL_HALF_WIDTH;
    const maxX = window.innerWidth - VIEWPORT_PADDING - PILL_HALF_WIDTH;
    const rawX = rect.left + rect.width / 2;
    const x = Math.min(Math.max(rawX, minX), maxX);
    el.style.transform = `translate3d(${String(x)}px, ${String(y)}px, 0) translateX(-50%)`;
  }, []);

  useEffect(() => {
    if (!hasSelection || dismissed) return;
    updatePosition();

    let rafId: number | null = null;
    const schedule = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updatePosition();
      });
    };

    window.addEventListener("scroll", schedule, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
    };
  }, [hasSelection, dismissed, updatePosition]);

  if (!hasSelection || dismissed) return null;

  return (
    <div
      ref={containerRef}
      className="pt-trigger-motion fixed left-0 top-0 z-[var(--pt-z-dialog)]"
    >
      <Tooltip
        content={`Optimize prompt · ${formatShortcut("mod+shift+k")}`}
        side="top"
      >
        <button
          type="button"
          data-testid={WIDGET_IDS.TRIGGER_BUTTON}
          onClick={onOpen}
          aria-label="Open Prompt Tuner"
          className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--pt-accent)] drop-shadow-[var(--pt-shadow)] transition-[color,filter,transform] duration-200 ease-out hover:text-[var(--pt-accent-hover)] hover:drop-shadow-[var(--pt-shadow-lg)] focus:outline-none focus-visible:text-[var(--pt-accent-hover)] focus-visible:drop-shadow-[var(--pt-shadow-lg)] motion-safe:hover:scale-110 motion-safe:active:scale-95 motion-safe:focus-visible:scale-110 motion-reduce:transition-[color,filter] motion-reduce:hover:outline motion-reduce:hover:outline-2 motion-reduce:hover:outline-offset-2 motion-reduce:hover:outline-[var(--pt-accent)] motion-reduce:focus-visible:outline motion-reduce:focus-visible:outline-2 motion-reduce:focus-visible:outline-offset-2 motion-reduce:focus-visible:outline-[var(--pt-accent)]"
        >
          <Logo className="h-5 w-5" />
        </button>
      </Tooltip>
    </div>
  );
}
