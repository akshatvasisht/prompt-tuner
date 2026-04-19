import type { Story } from "@ladle/react";
import { useEffect } from "react";
import SetupWizard from "./setup";

/**
 * Per-step stories. The wizard owns its `step` state internally, so each
 * story auto-advances by clicking the Continue button inside the Ladle
 * iframe the right number of times on mount.
 */
function Advance({ clicks }: { clicks: number }) {
  useEffect(() => {
    if (clicks <= 0) return;
    let attempts = 0;
    let done = 0;
    const tick = () => {
      const frame = document.querySelector<HTMLIFrameElement>(".ladle-iframe");
      const iframeDoc = frame?.contentDocument ?? document;
      const btn = Array.from(iframeDoc.querySelectorAll("button")).find((b) =>
        /Continue/i.test(b.textContent),
      );
      if (btn) {
        btn.click();
        done++;
        if (done >= clicks) return;
      }
      if (attempts++ < 60) window.setTimeout(tick, 40);
    };
    const id = window.setTimeout(tick, 40);
    return () => {
      window.clearTimeout(id);
    };
  }, [clicks]);
  return null;
}

export default {
  title: "Surfaces / Setup Wizard",
};

export const Welcome: Story = () => (
  <>
    <SetupWizard />
    <Advance clicks={0} />
  </>
);
Welcome.storyName = "Step 1 - Welcome";

export const Shortcuts: Story = () => (
  <>
    <SetupWizard />
    <Advance clicks={1} />
  </>
);
Shortcuts.storyName = "Step 2 - Shortcut Discovery";

export const NanoSetup: Story = () => (
  <>
    <SetupWizard />
    <Advance clicks={2} />
  </>
);
NanoSetup.storyName = "Step 3 - Gemini Nano Setup";

export const Actions: Story = () => (
  <>
    <SetupWizard />
    <Advance clicks={3} />
  </>
);
Actions.storyName = "Step 4 - Action Explainer";

export const RunOnOpen: Story = () => (
  <>
    <SetupWizard />
    <Advance clicks={4} />
  </>
);
RunOnOpen.storyName = "Step 5 - Run on Open";

export const Done: Story = () => (
  <>
    <SetupWizard />
    <Advance clicks={5} />
  </>
);
Done.storyName = "Step 6 - Done";
