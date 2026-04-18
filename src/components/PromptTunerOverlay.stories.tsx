import type { Story } from "@ladle/react";
import { useEffect } from "react";
import { CommandPaletteContent } from "./PromptTunerOverlay";
import { Toaster } from "./ui/Toaster";

/**
 * Stories for the overlay's four UI states.
 *
 * window.__ptMockScript is assigned at the top of each Story function
 * body — synchronously, during render — so the value is in place before
 * CommandPaletteContent mounts and opens its port. Assigning inside a
 * useEffect would race the mount order and strand the overlay.
 */

const SAMPLE_OUTPUT = `# Role
You are a senior product marketer at a privacy-focused AI company.

# Task
Write a compelling product launch announcement for a new on-device AI tool.

# Constraints
- Lead with the privacy benefit.
- 150 words maximum.
- Include one concrete user scenario.
- End with a clear call to action.

# Output format
A single announcement in plain prose, no headings.`;

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        maxWidth: 448,
        margin: "0 auto",
        background: "var(--pt-surface)",
        border: "1px solid var(--pt-surface-border)",
        borderRadius: "var(--pt-radius-lg)",
        boxShadow: "var(--pt-shadow-lg)",
        overflow: "hidden",
      }}
    >
      <Toaster />
      {children}
    </div>
  );
}

/**
 * Auto-clicks the first action so the story lands in the scripted
 * state without user input. Fires once on mount; bails if the overlay
 * has already transitioned past the selection view.
 */
function StartupHint({ enabled = true }: { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    // Ladle mounts React in the parent window but portals the rendered
    // DOM into an iframe. `document.querySelector` from the story runs
    // in the parent realm and can't see the iframe's DOM, so we reach
    // into the iframe explicitly.
    let attempts = 0;
    const tick = () => {
      const iframeDoc =
        (document.querySelector<HTMLIFrameElement>(".ladle-iframe")?.contentDocument) ??
        document;
      const first = iframeDoc.querySelector<HTMLElement>(
        '[role="option"][id="pt-action-0"]',
      );
      if (first) {
        first.click();
        return;
      }
      if (attempts++ < 30) window.setTimeout(tick, 30);
    };
    const id = window.setTimeout(tick, 30);
    return () => { window.clearTimeout(id); };
  }, [enabled]);
  return null;
}

export const Selection: Story = () => {
  window.__ptMockScript = undefined;
  window.__ptMockSelectedText = undefined;
  return (
    <Frame>
      <CommandPaletteContent onClose={() => undefined} />
    </Frame>
  );
};
Selection.storyName = "Selection";

export const Streaming: Story = () => {
  const chunks = SAMPLE_OUTPUT.match(/.{1,12}/gs) ?? [];
  window.__ptMockScript = {
    intervalMs: 200,
    messages: [
      { type: "TOKEN_INFO", count: 184, limit: 4096 },
      ...chunks.map((c) => ({ type: "CHUNK", data: c })),
    ],
  };
  window.__ptMockSelectedText = undefined;
  return (
    <Frame>
      <CommandPaletteContent onClose={() => undefined} />
      <StartupHint />
    </Frame>
  );
};
Streaming.storyName = "Streaming";

export const Complete: Story = () => {
  window.__ptMockScript = {
    intervalMs: 30,
    messages: [
      { type: "TOKEN_INFO", count: 184, limit: 4096 },
      { type: "COMPLETE", optimizedPrompt: SAMPLE_OUTPUT },
    ],
  };
  window.__ptMockSelectedText = undefined;
  return (
    <Frame>
      <CommandPaletteContent onClose={() => undefined} />
      <StartupHint />
    </Frame>
  );
};
Complete.storyName = "Complete";

export const ErrorState: Story = () => {
  window.__ptMockScript = {
    intervalMs: 30,
    messages: [{ type: "ERROR", code: "AI_UNAVAILABLE" }],
  };
  window.__ptMockSelectedText = undefined;
  return (
    <Frame>
      <CommandPaletteContent onClose={() => undefined} />
      <StartupHint />
    </Frame>
  );
};
ErrorState.storyName = "Error";

export const LongInputWarning: Story = () => {
  window.__ptMockSelectedText = "x".repeat(8000);
  window.__ptMockScript = {
    intervalMs: 30,
    messages: [{ type: "COMPLETE", optimizedPrompt: SAMPLE_OUTPUT }],
  };
  return (
    <Frame>
      <CommandPaletteContent onClose={() => undefined} />
      <StartupHint />
    </Frame>
  );
};
LongInputWarning.storyName = "Long input warning";
