import { cn } from "~lib/utils";

export type StatusDotVariant = "checking" | "success" | "warning" | "error";

const VARIANT_CLASSES: Record<StatusDotVariant, string> = {
  checking:
    "pt-status-dot-warning pt-ping-ring text-[var(--pt-status-warning)]",
  success: "pt-status-dot-success pt-check-pop",
  warning: "pt-status-dot-warning pt-pulse",
  error: "pt-status-dot-error",
};

interface StatusDotProps {
  variant: StatusDotVariant;
  className?: string;
}

export function StatusDot({ variant, className }: StatusDotProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-2 w-2 rounded-full",
        VARIANT_CLASSES[variant],
        className,
      )}
    />
  );
}
