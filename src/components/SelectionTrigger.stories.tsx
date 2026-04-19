import "../styles/globals.css";
import type { Story } from "@ladle/react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Tooltip } from "./ui/Tooltip";
import { Logo } from "./Logo";

/**
 * Stories for the floating selection trigger.
 *
 * The real SelectionTrigger depends on window.getSelection() and fixed
 * positioning relative to the selection rect. For visual review we render
 * the bare button in isolation at each interaction state.
 */

const STATE_CLASSES: Record<string, string> = {
  default: "",
  hover:
    "scale-110 text-[var(--pt-accent-hover)] drop-shadow-[var(--pt-shadow-lg)]",
  active: "scale-95 text-[var(--pt-accent-hover)]",
  focus:
    "scale-110 text-[var(--pt-accent-hover)] drop-shadow-[var(--pt-shadow-lg)]",
};

function Trigger({
  state = "default",
}: {
  state?: keyof typeof STATE_CLASSES;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={0}>
      <div
        style={{
          padding: 32,
          display: "flex",
          gap: 48,
          alignItems: "center",
          background: "var(--pt-bg-base)",
          minHeight: 200,
        }}
      >
        <Tooltip content="Optimize prompt (⌘⇧K)" side="top">
          <button
            type="button"
            aria-label="Open Prompt Tuner"
            className={`flex h-11 w-11 items-center justify-center rounded-full text-[var(--pt-accent)] drop-shadow-[var(--pt-shadow)] transition-[color,filter,transform] duration-200 ease-out focus:outline-none ${STATE_CLASSES[state] ?? ""}`}
          >
            <Logo className="h-5 w-5" />
          </button>
        </Tooltip>
        <span style={{ color: "var(--pt-text-secondary)", fontSize: 12 }}>
          state: {state}
        </span>
      </div>
    </TooltipPrimitive.Provider>
  );
}

export const Default: Story = () => <Trigger state="default" />;
export const Hover: Story = () => <Trigger state="hover" />;
export const Active: Story = () => <Trigger state="active" />;
export const Focus: Story = () => <Trigger state="focus" />;
