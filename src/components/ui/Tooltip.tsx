import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "~lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "right" | "bottom" | "left";
}

export function Tooltip({
  children,
  content,
  side = "top",
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={5}
          className={cn(
            "z-[var(--pt-z-tooltip)] overflow-hidden rounded-[var(--pt-radius-sm)] bg-[var(--pt-text-primary)] px-2.5 py-1.5",
            "text-xs font-medium text-white shadow-[var(--pt-shadow)]",
            "animate-in fade-in-0 slide-in-from-top-1",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1"
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-[var(--pt-text-primary)]" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
