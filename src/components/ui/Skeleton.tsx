import { cn } from "~lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--pt-radius-md)]",
        "bg-gradient-to-r from-[var(--pt-hover-bg)] via-[var(--pt-active-bg)] to-[var(--pt-hover-bg)]",
        "bg-[length:200%_100%]",
        className
      )}
      style={{ animation: "shimmer 2s infinite" }}
    />
  );
}
