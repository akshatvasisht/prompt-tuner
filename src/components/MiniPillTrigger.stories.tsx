import type { Story } from "@ladle/react";
import { Tooltip } from "./ui/Tooltip";
import { Logo } from "./Logo";

/**
 * Stories for the floating sparkle pill.
 *
 * The real MiniPillTrigger depends on window.getSelection() and fixed
 * positioning relative to the selection rect. For visual review we render
 * the bare button in isolation at each interaction state.
 */

function Pill({ state = "default" }: { state?: "default" | "hover" | "active" }) {
  const classByState: Record<string, string> = {
    default: "text-[var(--pt-accent)] drop-shadow-[var(--pt-shadow)]",
    hover: "text-[var(--pt-accent-hover)] drop-shadow-[var(--pt-shadow-lg)] scale-105",
    active: "text-[var(--pt-accent-hover)] drop-shadow-[var(--pt-shadow)] scale-95",
  };
  return (
    <div style={{ padding: 32, display: "flex", gap: 48, alignItems: "center" }}>
      <Tooltip content="Optimize prompt (⌘⇧K)" side="top">
        <button
          type="button"
          aria-label="Open Prompt Tuner"
          className={`flex h-8 w-8 items-center justify-center transition-all ${classByState[state] ?? ""}`}
        >
          <Logo className="h-full w-full" />
        </button>
      </Tooltip>
      <span style={{ color: "var(--pt-text-secondary)", fontSize: 12 }}>
        state: {state}
      </span>
    </div>
  );
}

export const Default: Story = () => <Pill state="default" />;
export const Hover: Story = () => <Pill state="hover" />;
export const Active: Story = () => <Pill state="active" />;
