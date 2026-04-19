import type { Story } from "@ladle/react";
import { KeyboardShortcut, KeyboardShortcutsCard } from "./KeyboardShortcut";

export default {
  title: "UI / KeyboardShortcut",
};

export const Hero: Story = () => (
  <div className="flex justify-center">
    <KeyboardShortcut variant="hero" keys={["⌘", "⇧", "K"]} />
  </div>
);
Hero.storyName = "Hero";

export const Inline: Story = () => (
  <p className="text-sm text-[var(--pt-text-secondary)]">
    Press <KeyboardShortcut variant="inline" keys={["⌘⇧K"]} /> to open the
    palette.
  </p>
);
Inline.storyName = "Inline";

export const Default: Story = () => (
  <div className="max-w-sm">
    <KeyboardShortcut
      variant="default"
      keys={["⌘", "K"]}
      description="Open palette"
    />
    <KeyboardShortcut
      variant="default"
      keys={["Esc"]}
      description="Close palette"
    />
  </div>
);
Default.storyName = "Default";

export const Card: Story = () => (
  <div className="max-w-sm">
    <KeyboardShortcutsCard
      shortcuts={[
        { keys: ["⌘", "⇧", "K"], description: "Toggle overlay" },
        { keys: ["↵"], description: "Insert result" },
        { keys: ["Esc"], description: "Close overlay" },
      ]}
    />
  </div>
);
Card.storyName = "Card grouping";
