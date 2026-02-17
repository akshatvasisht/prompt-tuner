import { useEffect, useState } from "react";
import { WIDGET_IDS } from "~lib/constants";
import { useTextSelection } from "~hooks/use-text-selection";
import { Tooltip } from "~components/ui/Tooltip";
import { Logo } from "~components/Logo";

export interface MiniPillTriggerProps {
  onOpen: () => void;
}

export function MiniPillTrigger({ onOpen }: MiniPillTriggerProps) {
  const { hasSelection, selectionRect } = useTextSelection();
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (selectionRect) {
      setPosition({
        top: selectionRect.top - 40,
        left: selectionRect.left + selectionRect.width / 2,
      });
    }
  }, [selectionRect]);

  useEffect(() => {
    if (!hasSelection) return;

    let rafId: number | null = null;
    const schedule = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        setPosition({
          top: rect.top - 40,
          left: rect.left + rect.width / 2,
        });
      });
    };

    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
    };
  }, [hasSelection]);

  if (!hasSelection) return null;

  return (
    <div
      className="pt-pill-motion fixed z-[var(--pt-z-dialog)]"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
      }}
    >
      <Tooltip content="Optimize prompt (⌘⇧K)" side="top">
        <button
          type="button"
          data-testid={WIDGET_IDS.TRIGGER_BUTTON}
          onClick={onOpen}
          aria-label="Open Prompt Tuner"
          className="flex h-8 w-8 items-center justify-center rounded-[var(--pt-radius-sm)] text-[var(--pt-accent)] drop-shadow-[var(--pt-shadow)] transition-all hover:text-[var(--pt-accent-hover)] hover:scale-105 active:scale-95"
        >
          <Logo className="h-full w-full" />
        </button>
      </Tooltip>
    </div>
  );
}
