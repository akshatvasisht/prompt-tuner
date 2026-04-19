import { Toaster as Sonner } from "sonner";
import { X } from "~lib/icons";
import type React from "react";
import { useEffect, useState } from "react";
import { cn } from "~lib/utils";

function useSystemTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
    };
  }, []);
  return theme;
}

function usePageVisibilityClass() {
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      root.classList.toggle(
        "pt-page-hidden",
        document.visibilityState === "hidden",
      );
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      root.classList.remove("pt-page-hidden");
    };
  }, []);
}

export function Toaster() {
  const theme = useSystemTheme();
  usePageVisibilityClass();
  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      offset={16}
      visibleToasts={3}
      duration={5000}
      closeButton
      icons={{ close: <X size={14} weight="bold" /> }}
      className="toaster group"
      style={
        {
          zIndex: "var(--pt-z-toast)" as unknown as number,
          fontFamily: "var(--pt-font-body)",
          "--offset": "12px",
        } as React.CSSProperties
      }
      toastOptions={{
        // Action/cancel button styling lives in globals.css - Tailwind
        // group variants can't beat Sonner's own [data-button] rules on
        // specificity, so the override is applied as raw CSS instead.
        classNames: {
          toast: cn(
            "group toast font-sans pt-toast",
            "group-[.toaster]:bg-[var(--pt-surface)] group-[.toaster]:text-[var(--pt-text-primary)]",
            "group-[.toaster]:border group-[.toaster]:border-[var(--pt-surface-border)]",
            "group-[.toaster]:rounded-[var(--pt-radius-md)] group-[.toaster]:shadow-[var(--pt-shadow)]",
          ),
          title: "text-sm font-semibold text-[var(--pt-text-primary)]",
          description:
            "font-sans text-xs text-[var(--pt-text-secondary)] leading-snug",
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
