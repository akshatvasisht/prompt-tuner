/* eslint-disable @typescript-eslint/no-deprecated */
import { useEffect, useState } from "react";
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
import { isWarmed, checkAIAvailability } from "~lib/ai-engine";

export interface CommandPaletteContentProps {
  onClose: () => void;
}

export function CommandPaletteContent({ onClose }: CommandPaletteContentProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"selection" | "streaming" | "complete">("selection");
  const [streamBuffer, setStreamBuffer] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);

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

    setStatus("streaming");
    setActiveAction(action.label);
    setStreamBuffer("");

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
          setStreamBuffer((prev) => prev + msg.data);
        } else if (msg.type === "COMPLETE") {
          completed = true;
          // Use the complete draft to ensure consistency
          setStreamBuffer(msg.optimizedPrompt);
          setStatus("complete");
          port.disconnect();
        } else if (msg.type === "ERROR") {
          completed = true;
          toast.error(msg.message);
          setStatus("selection");
          port.disconnect();
        }
      });

      port.onDisconnect.addListener(() => {
        if (!completed) {
          toast.error("Connection lost");
          setStatus("selection");
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
      toast.error("Something went wrong");
      setStatus("selection");
    }
  };

  const handleApply = () => {
    const success = replaceSelectedText(streamBuffer);
    if (success) {
      toast.success("Applied!");
      onClose();
    } else {
      toast.error("Failed to replace text");
    }
  };

  if (status === "streaming" || status === "complete") {
    return (
      <div className="flex flex-col h-full min-h-[300px]">
        <div className="flex items-center justify-between border-b border-[var(--pt-glass-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            <span className="text-[13px] font-semibold uppercase tracking-wider text-[var(--pt-text-primary)]">
              {activeAction}
            </span>
          </div>
          {status === "streaming" && (
            <span className="text-[11px] font-medium text-[var(--pt-text-secondary)]">
              Streaming tokens...
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--pt-text-primary)] antialiased">
            {streamBuffer}
            {status === "streaming" && (
              <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-blue-500/50 align-middle" />
            )}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--pt-glass-border)] px-5 py-4">
          <button
            onClick={() => { setStatus("selection"); }}
            className="text-[13px] font-medium text-[var(--pt-text-secondary)] hover:text-white transition-colors"
          >
            Cancel
          </button>

          {status === "complete" && (
            <button
              onClick={handleApply}
              className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white shadow-lg hover:bg-blue-500 transition-all active:scale-95"
            >
              Apply Changes
            </button>
          )}
        </div>
      </div>
    );
  }

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

        <AIStatusIndicator />
      </div>
    </>
  );
}

function AIStatusIndicator() {
  const [status, setStatus] = useState<"ready" | "loading" | "error">("loading");

  useEffect(() => {
    const checkStatus = async () => {
      if (isWarmed()) {
        setStatus("ready");
      } else {
        const availability = await checkAIAvailability();
        if (availability.available) {
          setStatus("loading");
        } else {
          setStatus("error");
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => { clearInterval(interval); };
  }, []);

  const Config = {
    ready: { color: "bg-emerald-500", label: "AI Engine Ready" },
    loading: { color: "bg-amber-500", label: "AI Engine Warming..." },
    error: { color: "bg-red-500", label: "AI Engine Unavailable" },
  };

  const current = Config[status];

  return (
    <div className="flex items-center gap-2 opacity-80 transition-opacity hover:opacity-100">
      <div className={`h-1.5 w-1.5 rounded-full ${current.color} shadow-[0_0_8px_rgba(0,0,0,0.3)]`} />
      <span className="text-[10px] font-semibold uppercase tracking-wider">{current.label}</span>
    </div>
  );
}
