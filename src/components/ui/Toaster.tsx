import { Toaster as Sonner } from "sonner";
import { X } from "~lib/icons";
import type React from "react";
import { useEffect, useState } from "react";
import { cn } from "~lib/utils";

function useSystemTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => { setTheme(e.matches ? "dark" : "light"); };
    mq.addEventListener("change", onChange);
    return () => { mq.removeEventListener("change", onChange); };
  }, []);
  return theme;
}

export function Toaster() {
  const theme = useSystemTheme();
  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      offset={16}
      visibleToasts={3}
      duration={5000}
      closeButton
      icons={{ close: <X size={12} weight="bold" /> }}
      className="toaster group"
      style={{
        zIndex: "var(--pt-z-toast)" as unknown as number,
        fontFamily: "var(--pt-font-body)",
        // Sonner reads --width to size each toast — 280px matches extension density
        "--width": "280px",
        "--offset": "12px",
      } as React.CSSProperties}
      toastOptions={{
        style: { padding: "10px 14px", gap: "8px" },
        classNames: {
          toast: cn(
            "group toast font-sans",
            "group-[.toaster]:bg-[var(--pt-surface)] group-[.toaster]:text-[var(--pt-text-primary)]",
            "group-[.toaster]:border group-[.toaster]:border-[var(--pt-surface-border)]",
            "group-[.toaster]:rounded-[var(--pt-radius-md)] group-[.toaster]:shadow-[var(--pt-shadow)]",
          ),
          title: "text-sm font-semibold text-[var(--pt-text-primary)]",
          description: "font-sans text-xs text-[var(--pt-text-secondary)] leading-snug",
          // Quiet text links — no pill, no background, matches overlay's Cancel/Insert/Retry
          actionButton:
            "group-[.toast]:bg-transparent group-[.toast]:text-[var(--pt-accent)] group-[.toast]:font-semibold group-[.toast]:shadow-none group-[.toast]:px-0 group-[.toast]:hover:text-[var(--pt-accent-hover)]",
          cancelButton:
            "group-[.toast]:bg-transparent group-[.toast]:text-[var(--pt-text-secondary)] group-[.toast]:font-medium group-[.toast]:shadow-none group-[.toast]:px-0",
          closeButton: cn(
            // Override Sonner's absolute corner positioning — sit inline at end of toast row
            "group-[.toast]:!static group-[.toast]:!translate-x-0 group-[.toast]:!translate-y-0",
            "group-[.toast]:!order-last group-[.toast]:!self-center",
            "group-[.toast]:!h-5 group-[.toast]:!w-5 group-[.toast]:!p-0",
            "group-[.toast]:!bg-transparent group-[.toast]:!border-0",
            "group-[.toast]:!rounded-[var(--pt-radius-sm)]",
            "group-[.toast]:text-[var(--pt-text-tertiary)] group-[.toast]:hover:bg-[var(--pt-hover-bg)] group-[.toast]:hover:text-[var(--pt-text-primary)]",
          ),
          success:
            "group-[.toaster]:bg-[var(--pt-status-success-bg)] group-[.toaster]:border-[var(--pt-status-success-bg)] [&_[data-icon]]:text-[var(--pt-status-success)]",
          error:
            "group-[.toaster]:bg-[var(--pt-status-error-bg)] group-[.toaster]:border-[var(--pt-status-error-bg)] [&_[data-icon]]:text-[var(--pt-status-error)]",
          warning:
            "group-[.toaster]:bg-[var(--pt-status-warning-bg)] group-[.toaster]:border-[var(--pt-status-warning-bg)] [&_[data-icon]]:text-[var(--pt-status-warning)]",
        },
      }}
    />
  );
}
