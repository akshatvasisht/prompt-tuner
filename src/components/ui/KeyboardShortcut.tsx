import * as React from "react";
import { cn } from "~lib/utils";

interface KeyboardShortcutProps {
  keys: string[];
  description?: string;
  variant?: "default" | "hero" | "inline";
  className?: string;
}

export function KeyboardShortcut({
  keys,
  description = "",
  variant = "default",
  className,
}: KeyboardShortcutProps) {
  if (variant === "hero") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="text-[var(--pt-text-tertiary)] mx-2 text-sm font-medium">+</span>
            )}
            <kbd className="font-mono text-3xl font-bold text-[var(--pt-text-primary)] tracking-widest bg-[var(--pt-hover-bg)] px-6 py-3 rounded-lg border border-[var(--pt-surface-border)]">
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-1", className)}>
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="text-xs text-[var(--pt-text-tertiary)]">+</span>
            )}
            <kbd className="font-mono font-semibold text-[var(--pt-text-primary)] bg-[var(--pt-hover-bg)] px-2 py-0.5 rounded border border-[var(--pt-surface-border)]">
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </span>
    );
  }

  // default
  return (
    <div className={cn("flex items-center justify-between py-2", className)}>
      <span className="text-sm text-[var(--pt-text-secondary)]">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="text-xs text-[var(--pt-text-tertiary)] mx-1">+</span>
            )}
            <kbd className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-[var(--pt-text-primary)] bg-[var(--pt-hover-bg)] border border-[var(--pt-surface-border)] rounded">
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsCard({
  shortcuts,
  title = "Keyboard Shortcuts",
  className,
}: {
  shortcuts: { keys: string[]; description: string }[];
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--pt-radius-lg)] border border-[var(--pt-surface-border)] bg-[var(--pt-surface)] p-5",
        "shadow-[var(--pt-shadow)]",
        className
      )}
    >
      <h3 className="text-sm font-semibold text-[var(--pt-text-primary)] mb-3">
        {title}
      </h3>
      <div className="space-y-1">
        {shortcuts.map((shortcut, index) => (
          <KeyboardShortcut
            key={index}
            keys={shortcut.keys}
            description={shortcut.description}
          />
        ))}
      </div>
    </div>
  );
}
