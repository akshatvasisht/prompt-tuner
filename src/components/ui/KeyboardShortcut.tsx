import * as React from "react";
import { Command } from "~lib/icons";
import { cn } from "~lib/utils";

const MODIFIER_LABELS: Record<string, string> = {
  "⌘": "Command",
  "⇧": "Shift",
  "⌥": "Option",
  "⌃": "Control",
};

function KeyGlyph({ keyName }: { keyName: string }): React.ReactNode {
  if (keyName === "⌘") return <Command weight="bold" aria-label="Command" />;
  const label = MODIFIER_LABELS[keyName];
  if (label) {
    return (
      <abbr title={label} aria-label={label} className="no-underline">
        {keyName}
      </abbr>
    );
  }
  return <>{keyName}</>;
}

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
              <span
                aria-hidden="true"
                className="text-[var(--pt-text-tertiary)] mx-2 text-sm font-medium"
              >
                +
              </span>
            )}
            <kbd className="inline-flex items-center justify-center min-w-[2.5em] font-sans text-base font-semibold text-[var(--pt-text-primary)] tracking-wide bg-[var(--pt-hover-bg)] px-3 py-1.5 rounded-[var(--pt-radius-md)] border border-[var(--pt-surface-border)]">
              <KeyGlyph keyName={key} />
            </kbd>
          </React.Fragment>
        ))}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <span
                aria-hidden="true"
                className="text-xs text-[var(--pt-text-tertiary)] px-0.5"
              >
                +
              </span>
            )}
            <kbd className="inline-flex items-center justify-center font-sans text-xs font-semibold text-[var(--pt-text-primary)] bg-[var(--pt-hover-bg)] px-2 py-0.5 rounded-[var(--pt-radius-sm)] border border-[var(--pt-surface-border)]">
              <KeyGlyph keyName={key} />
            </kbd>
          </React.Fragment>
        ))}
      </span>
    );
  }

  // default
  const groupLabel = description
    ? `${description}: ${keys.join(" plus ")}`
    : undefined;
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-1.5",
        className,
      )}
      role="group"
      aria-label={groupLabel}
    >
      <span className="text-[13px] text-[var(--pt-text-secondary)] leading-snug">
        {description}
      </span>
      <div
        className="flex items-center gap-0.5 shrink-0"
        aria-hidden="true"
      >
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="text-[10px] text-[var(--pt-text-quaternary)] mx-0.5">
                +
              </span>
            )}
            <kbd className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[11px] font-semibold text-[var(--pt-text-primary)] bg-[var(--pt-hover-bg)] border border-[var(--pt-surface-border)] rounded-[var(--pt-radius-sm)]">
              <KeyGlyph keyName={key} />
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
        "rounded-[var(--pt-radius-lg)] border border-[var(--pt-surface-border)] bg-[var(--pt-surface)] px-4 pt-3 pb-2.5",
        "shadow-[var(--pt-shadow)]",
        className,
      )}
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--pt-text-tertiary)] mb-2 pb-2 border-b border-[var(--pt-surface-border)]">
        {title}
      </h3>
      <div className="flex flex-col">
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
