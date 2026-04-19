import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "~lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
}

/**
 * Relies on a TooltipPrimitive.Provider mounted at the app root
 * (see Overlay.tsx). Wrapping each Tooltip in its own Provider would
 * shadow the app-level delayDuration and allocate duplicate context.
 */
export function Tooltip({
  children,
  content,
  side = "top",
  delayDuration = 600,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-[var(--pt-z-tooltip)] max-w-xs rounded-md px-2.5 py-1.5",
            "text-xs font-medium",
            "bg-[var(--pt-tooltip-bg)] text-[var(--pt-tooltip-fg)]",
            "shadow-[0_4px_12px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.12)]",
            "animate-in fade-in-0 slide-in-from-top-1",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1",
            "motion-reduce:animate-none motion-reduce:data-[state=closed]:animate-none",
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-[var(--pt-tooltip-bg)]" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
