import { cn } from "~lib/utils";

interface SkeletonProps {
  className?: string;
  /**
   * Optional. Omit when many skeletons render together - let a single parent
   * region announce "Loading X" instead of every skeleton announcing itself.
   */
  label?: string;
}

export function Skeleton({ className, label }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className={cn(
        "pt-skeleton rounded-[var(--pt-radius-md)]",
        "bg-gradient-to-r from-[var(--pt-hover-bg)] via-[var(--pt-active-bg)] to-[var(--pt-hover-bg)]",
        "bg-[length:200%_100%]",
        className,
      )}
    />
  );
}
