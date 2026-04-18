/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Story } from "@ladle/react";
import Popup from "./popup";

/**
 * Stub Chrome's global LanguageModel to drive each status state.
 *
 * Popup calls `checkAIAvailability()` in a mount effect, which calls
 * `LanguageModel.availability()`. Setting the global synchronously in
 * the story body ensures it's there by the time the effect fires.
 */
function setAvailability(
  result: "available" | "downloadable" | "unavailable" | "pending",
) {
  if (result === "pending") {
    (window as any).LanguageModel = {
      availability: () => new Promise(() => undefined),
    };
    return;
  }
  (window as any).LanguageModel = {
    availability: () => Promise.resolve(result),
  };
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div style={{ width: 320 }}>{children}</div>;
}

export const Ready: Story = () => {
  setAvailability("available");
  return (
    <Frame>
      <Popup />
    </Frame>
  );
};

export const Checking: Story = () => {
  setAvailability("pending");
  return (
    <Frame>
      <Popup />
    </Frame>
  );
};

export const Unavailable: Story = () => {
  setAvailability("unavailable");
  return (
    <Frame>
      <Popup />
    </Frame>
  );
};

export const NeedsDownload: Story = () => {
  setAvailability("downloadable");
  return (
    <Frame>
      <Popup />
    </Frame>
  );
};
NeedsDownload.storyName = "Needs Download";
