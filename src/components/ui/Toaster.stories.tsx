import type { Story } from "@ladle/react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "./Toaster";

/**
 * Stories for the three toast variants so we can review the derived-from-
 * blue status palette (ink red, muted ochre, desaturated teal) on cream.
 */

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: 200, padding: 24 }}>
      <Toaster />
      {children}
    </div>
  );
}

export const Default: Story = () => {
  useEffect(() => {
    toast("Prompt inserted", {
      description: "Undo to restore your original text.",
      action: {
        label: "Undo",
        onClick: () => undefined,
      },
    });
  }, []);
  return <Frame><span /></Frame>;
};

export const Success: Story = () => {
  useEffect(() => {
    toast.success("Prompt inserted", {
      description: "Press Undo to restore your original text.",
    });
  }, []);
  return <Frame><span /></Frame>;
};

export const ErrorToast: Story = () => {
  useEffect(() => {
    toast.error("Gemini Nano unavailable", {
      description: "Enable the optimization-guide-on-device flag in chrome://flags.",
    });
  }, []);
  return <Frame><span /></Frame>;
};
ErrorToast.storyName = "Error";

export const Warning: Story = () => {
  useEffect(() => {
    toast.warning("Input is long", {
      description: "Output may be truncated — consider shortening your selection.",
    });
  }, []);
  return <Frame><span /></Frame>;
};
