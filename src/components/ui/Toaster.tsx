"use client";

import { Toaster as Sonner } from "sonner";
import { cn } from "~lib/cn";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: cn(
            "group toast group-[.toaster]:bg-[var(--pt-glass-bg)] group-[.toaster]:text-[var(--pt-text-primary)]",
            "group-[.toaster]:border-[var(--pt-glass-border)] group-[.toaster]:shadow-2xl",
          ),
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
    />
  );
}
