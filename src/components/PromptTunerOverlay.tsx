/* eslint-disable @typescript-eslint/no-deprecated */
import { useState } from "react";
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~components/ui/Command";
import { toast } from "sonner";
import { getSelectedText, replaceSelectedText } from "~lib/text-replacer";
import { detectPlatform } from "~lib/platform-detector";

import { ACTIONS } from "~lib/actions";
import { PORT_NAMES, MESSAGE_TYPES } from "~lib/constants";

import {
  type OptimizePortMessage,
  type OptimizePortRequest,
} from "~types";

import { logger } from "~lib/logger";

export interface CommandPaletteContentProps {
  onClose: () => void;
}

export function CommandPaletteContent({ onClose }: CommandPaletteContentProps) {
  const [search, setSearch] = useState("");

  const handleAction = (actionId: string) => {
    const action = ACTIONS.find((a) => a.id === actionId);
    if (!action) {
      logger.error(`Action with ID ${actionId} not found.`);
      return;
    }

    const selectedText = getSelectedText();
    if (!selectedText?.trim()) {
      toast.error("No text selected");
      return;
    }

    onClose();

    const toastId = toast.loading(`${action.label}...`);

    let completed = false;

    try {
      const port = chrome.runtime.connect({ name: PORT_NAMES.OPTIMIZE });

      port.onMessage.addListener((message: unknown) => {
        if (!message || typeof message !== "object") {
          logger.error("Received invalid message from optimize port.");
          return;
        }
        const msg = message as OptimizePortMessage;

        if (msg.type === "CHUNK") {
          // Optional: stream into field; we only replace on COMPLETE for simplicity
        } else if (msg.type === "COMPLETE") {
          completed = true;
          const success = replaceSelectedText(msg.optimizedPrompt);
          if (success) {
            toast.success("Done!", { id: toastId });
          } else {
            toast.error("Failed to replace text", { id: toastId });
          }
          port.disconnect();
        } else if (msg.type === "ERROR") {
          completed = true;
          toast.error(msg.message, { id: toastId });
          port.disconnect();
        }
      });

      port.onDisconnect.addListener(() => {
        if (!completed) {
          toast.error("Connection lost", { id: toastId });
        }
      });

      const request: OptimizePortRequest = {
        type: MESSAGE_TYPES.START_OPTIMIZATION,
        draft: selectedText.trim(),
        platform: detectPlatform(),
      };

      port.postMessage(request);
    } catch {
      logger.error("Overlay optimization error: Something went wrong");
      toast.error("Something went wrong", { id: toastId });
    }
  };

  return (
    <>
      <CommandInput
        placeholder="Optimize or draft with Gemini..."
        value={search}
        onValueChange={setSearch}
        className="h-16 border-b border-[var(--pt-glass-border)] px-5 text-[14px] font-medium text-[var(--pt-text-primary)] placeholder:text-[var(--pt-text-secondary)]"
      />
      <CommandList className="max-h-[400px] overflow-y-auto py-2">
        <CommandEmpty className="py-12 text-center text-[14px] text-zinc-500 antialiased">
          No matches found.
        </CommandEmpty>
        <CommandGroup heading={<span className="px-2 text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--pt-text-secondary)] opacity-80">Actions</span>} className="px-2 pb-2">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <CommandItem
                key={action.id}
                value={action.label}
                keywords={action.keywords}
                onSelect={() => {
                  handleAction(action.id);
                }}
                className="group flex cursor-pointer items-center gap-3.5 rounded-[10px] px-3 py-3 transition-all duration-150"
              >
                <Icon
                  className="h-4.5 w-4.5 text-[var(--pt-text-secondary)] group-aria-selected:text-[var(--pt-text-primary)] transition-colors"
                  weight="regular"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-medium tracking-tight text-white transition-colors">
                    {action.label}
                  </span>
                  <span className="text-[12px] text-[var(--pt-text-secondary)] tracking-tight group-aria-selected:text-white transition-colors">
                    {action.description}
                  </span>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>

      <div className="flex items-center justify-between border-t border-[var(--pt-glass-border)] px-5 py-3.5 text-[12px] text-[var(--pt-text-secondary)] antialiased">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5 font-medium">
            <kbd className="flex h-5 items-center justify-center rounded-[4px] bg-white/10 px-1 font-sans text-[10px] font-bold text-white min-w-[20px]">↵</kbd> Select
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <kbd className="flex h-5 items-center justify-center rounded-[4px] bg-white/10 px-1 font-sans text-[10px] font-bold text-white min-w-[20px]">esc</kbd> Close
          </span>
        </div>
      </div>
    </>
  );
}
