import type { Story } from "@ladle/react";
import { ErrorBoundary } from "./ErrorBoundary";

function Boom(): React.JSX.Element {
  throw new Error(
    "Intentional story error - renders the ErrorBoundary fallback.",
  );
}

export default {
  title: "Primitives / ErrorBoundary",
};

export const Fallback: Story = () => (
  <div
    style={{
      width: 320,
      margin: "0 auto",
      background: "var(--pt-surface)",
      border: "1px solid var(--pt-surface-border)",
      borderRadius: "var(--pt-radius-lg)",
      boxShadow: "var(--pt-shadow-lg)",
      overflow: "hidden",
    }}
  >
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>
  </div>
);
Fallback.storyName = "Fallback state";

export const HappyPath: Story = () => (
  <ErrorBoundary>
    <div className="p-4 text-sm text-[var(--pt-text-primary)]">
      Children render normally when nothing throws.
    </div>
  </ErrorBoundary>
);
HappyPath.storyName = "Happy path (no error)";
