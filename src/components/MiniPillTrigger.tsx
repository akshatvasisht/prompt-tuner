import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { WIDGET_IDS } from "~lib/constants";
import { useTextSelection } from "~hooks/use-text-selection";

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

  if (!hasSelection) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          transform: "translateX(-50%)",
          zIndex: 99999,
        }}
      >
        <button
          type="button"
          data-testid={WIDGET_IDS.TRIGGER_BUTTON}
          onClick={onOpen}
          className="flex h-8 items-center gap-2 rounded-full border border-white/10 bg-zinc-950 px-3 shadow-glass transition-all hover:bg-zinc-900 active:scale-95"
        >
          <Sparkles className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
          <span className="text-xs font-medium tracking-tight text-zinc-100">Tune</span>
          <span className="ml-1 text-[10px] text-zinc-500 font-medium">⌘⇧K</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
