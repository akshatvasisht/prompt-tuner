import { useEffect, useMemo, useState, useCallback } from "react";
import { ArrowClockwise, Keyboard } from "~lib/icons";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { KeyboardShortcutsCard } from "~components/ui/KeyboardShortcut";
import { isMacPlatform } from "~lib/platform-shortcut";
import { Logo } from "~components/Logo";
import { Button } from "~components/ui/Button";
import { Label } from "~components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~components/ui/Select";
import { Switch } from "~components/ui/Switch";
import { Tooltip } from "~components/ui/Tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Skeleton } from "~components/ui/Skeleton";
import { StatusDot } from "~components/ui/StatusDot";
import { ErrorBoundary } from "~components/ErrorBoundary";
import { checkAIAvailability } from "~lib/ai-availability";
import { ACTIONS } from "~lib/actions";
import { STORAGE_KEYS } from "~lib/constants";
import { logger } from "~lib/logger";
import { storage, tabs } from "~lib/storage";
import { toast } from "sonner";
import { Toaster } from "~components/ui/Toaster";
import "./styles/globals.css";

type Status = "checking" | "ready" | "unavailable" | "needs-download";

/**
 * Chrome's legacy window.ai.languageModel surface (pre-LanguageModel global).
 */
interface WindowAI {
  languageModel: {
    create: (options: {
      monitor: (m: EventTarget) => void;
    }) => Promise<unknown>;
  };
}

export default function Popup(): React.JSX.Element {
  const [status, setStatus] = useState<Status>("checking");
  const [isEnabled, setIsEnabled] = useState(true);
  const [defaultAction, setDefaultAction] = useState<string>("");
  const [runOnOpen, setRunOnOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const checkStatus = useCallback(async (): Promise<void> => {
    setStatus("checking");
    try {
      const availability = await checkAIAvailability();
      if (availability.available) setStatus("ready");
      else if (availability.needsDownload) setStatus("needs-download");
      else setStatus("unavailable");
    } catch (error) {
      logger.error("Failed to check AI status:", error);
      setStatus("unavailable");
    }
  }, []);

  const loadSettings = useCallback(async (): Promise<void> => {
    const result = await storage.get([
      "enabled",
      STORAGE_KEYS.DEFAULT_ACTION,
      STORAGE_KEYS.RUN_ON_OPEN,
    ]);
    setIsEnabled(result.enabled !== false);
    setDefaultAction(
      (result[STORAGE_KEYS.DEFAULT_ACTION] as string | undefined) ?? "",
    );
    setRunOnOpen(
      (result[STORAGE_KEYS.RUN_ON_OPEN] as boolean | undefined) ?? false,
    );
  }, []);

  const toggleEnabled = useCallback(async (): Promise<void> => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    await storage.set({ enabled: newValue });
  }, [isEnabled]);

  const openFlags = useCallback((): void => {
    void tabs.create("chrome://flags/#optimization-guide-on-device-model");
  }, []);

  const handleDefaultActionChange = useCallback(
    async (actionId: string): Promise<void> => {
      const value = actionId === "__none__" ? "" : actionId;
      setDefaultAction(value);
      await storage.set({ [STORAGE_KEYS.DEFAULT_ACTION]: value });
      if (!value) {
        setRunOnOpen(false);
        await storage.set({ [STORAGE_KEYS.RUN_ON_OPEN]: false });
      }
    },
    [],
  );

  const handleRunOnOpenChange = useCallback(
    async (checked: boolean): Promise<void> => {
      setRunOnOpen(checked);
      await storage.set({ [STORAGE_KEYS.RUN_ON_OPEN]: checked });
    },
    [],
  );

  useEffect(() => {
    void checkStatus();
    void loadSettings();
  }, [checkStatus, loadSettings]);

  const isModelReady = status === "ready";
  const progressPct =
    downloadProgress !== null ? Math.round(downloadProgress * 100) : 0;

  const shortcutEntries = useMemo(
    () => [
      {
        keys: isMacPlatform() ? ["⌘", "⇧", "K"] : ["Ctrl", "⇧", "K"],
        description: "Open / close palette",
      },
      { keys: ["↑", "↓"], description: "Navigate actions" },
      { keys: ["↵"], description: "Run selected action" },
      { keys: ["Esc"], description: "Dismiss" },
    ],
    [],
  );

  return (
    <TooltipPrimitive.Provider delayDuration={600} skipDelayDuration={300}>
      <div
        className="w-[320px] overflow-hidden rounded-[var(--pt-radius-lg)] border border-[var(--pt-surface-border)] bg-[var(--pt-surface)] text-[var(--pt-text-primary)]"
        style={{ boxShadow: "var(--pt-shadow-lg)" }}
      >
        <ErrorBoundary>
          {/* The content overlay also mounts a Sonner Toaster (Overlay.tsx).
            Both are scoped to their own execution context (popup page vs
            content script), so there's no cross-mount collision. */}
          <Toaster />

          <div className="flex items-center gap-2.5 border-b border-[var(--pt-surface-border)] px-4 py-2.5">
            <Logo className="h-6 w-6 text-[var(--pt-accent)]" />
            <h1 className="text-base font-semibold tracking-tight">
              Prompt Tuner
            </h1>
            {isModelReady && (
              <PopoverPrimitive.Root>
                <Tooltip content="Keyboard shortcuts" side="left">
                  <PopoverPrimitive.Trigger asChild>
                    <button
                      type="button"
                      aria-label="Keyboard shortcuts"
                      className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-[var(--pt-radius-sm)] text-[var(--pt-text-tertiary)] outline-none transition-colors hover:bg-[var(--pt-hover-bg)] hover:text-[var(--pt-text-primary)]"
                    >
                      <Keyboard size={14} weight="regular" aria-hidden="true" />
                    </button>
                  </PopoverPrimitive.Trigger>
                </Tooltip>
                <PopoverPrimitive.Portal>
                  <PopoverPrimitive.Content
                    side="bottom"
                    align="end"
                    sideOffset={6}
                    className="z-[var(--pt-z-dialog)] w-[260px] outline-none animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none"
                  >
                    <KeyboardShortcutsCard
                      shortcuts={shortcutEntries}
                      title="Shortcuts"
                    />
                  </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
              </PopoverPrimitive.Root>
            )}
          </div>

          <div className="p-1.5 flex flex-col">
            <div
              className="flex items-center justify-between px-3 py-2 rounded-[var(--pt-radius-md)] transition-colors hover:bg-[var(--pt-hover-bg)]"
              role="status"
              aria-live="polite"
              aria-busy={status === "checking" || downloadProgress !== null}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                {status === "checking" && (
                  <>
                    <StatusDot variant="checking" />
                    <Skeleton className="h-3.5 w-16" />
                  </>
                )}
                {status === "ready" && (
                  <>
                    <StatusDot variant="success" />
                    <span>Ready</span>
                  </>
                )}
                {status === "unavailable" && (
                  <>
                    <StatusDot variant="error" />
                    <span className="pt-status-error">Not Available</span>
                  </>
                )}
                {status === "needs-download" && (
                  <>
                    <StatusDot variant="warning" />
                    <span className="pt-status-warning">Model Download</span>
                  </>
                )}
              </div>
              <Tooltip content="Refresh AI status" side="left">
                <button
                  onClick={() => void checkStatus()}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-[var(--pt-radius-sm)] text-[var(--pt-text-tertiary)] outline-none transition-colors hover:text-[var(--pt-text-primary)] hover:bg-[var(--pt-hover-bg)]"
                  aria-label="Refresh AI status"
                >
                  <ArrowClockwise
                    className={
                      status === "checking"
                        ? "h-4 w-4 animate-spin"
                        : "h-4 w-4 icon-hover"
                    }
                    weight="regular"
                  />
                </button>
              </Tooltip>
            </div>

            {(status === "unavailable" || status === "needs-download") && (
              <div className="flex flex-col gap-1.5 px-3 pt-1 pb-1.5">
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      if (status === "needs-download") {
                        setDownloadProgress(0);
                        try {
                          void (
                            window as Window & { ai?: WindowAI }
                          ).ai?.languageModel
                            .create({
                              monitor(m: EventTarget) {
                                m.addEventListener(
                                  "downloadprogress",
                                  (
                                    e: Event & {
                                      loaded?: number;
                                      total?: number;
                                    },
                                  ) => {
                                    if (
                                      e.loaded != null &&
                                      e.total != null &&
                                      e.total > 0
                                    ) {
                                      setDownloadProgress(e.loaded / e.total);
                                    }
                                  },
                                );
                              },
                            })
                            .then(() => {
                              setDownloadProgress(null);
                              setStatus("ready");
                              toast.success("Model ready", {
                                icon: (
                                  <span className="pt-check-pop inline-flex text-[var(--pt-status-success)]">
                                    ✓
                                  </span>
                                ),
                              });
                            })
                            .catch(() => {
                              setDownloadProgress(null);
                              toast.error("Download failed. Try again.");
                            });
                        } catch {
                          setDownloadProgress(null);
                        }
                      } else {
                        openFlags();
                      }
                    }}
                    variant="secondary"
                    size="sm"
                    disabled={downloadProgress !== null}
                  >
                    {downloadProgress !== null
                      ? `Downloading… ${String(progressPct)}%`
                      : status === "needs-download"
                        ? "Start download"
                        : "Enable Gemini Nano"}
                  </Button>
                </div>
                {downloadProgress !== null && (
                  <div
                    className="w-full h-1 rounded-full overflow-hidden bg-[var(--pt-hover-bg)]"
                    role="progressbar"
                    aria-valuenow={progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Model download progress"
                  >
                    <div
                      className="h-full rounded-full bg-[var(--pt-accent)] transition-[width] duration-300 ease-out"
                      style={{ width: `${String(progressPct)}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {isModelReady && (
              <>
                <div
                  className="mx-1 my-1 h-px bg-[var(--pt-surface-border)]"
                  aria-hidden
                />

                <div
                  role="group"
                  aria-label="Extension settings"
                  className="contents"
                >
                  <div className="flex items-center justify-between px-3 py-2 rounded-[var(--pt-radius-md)] transition-colors hover:bg-[var(--pt-hover-bg)]">
                    <Label
                      htmlFor="extension-enabled"
                      className="text-sm font-medium tracking-tight"
                    >
                      Extension Enabled
                    </Label>
                    <Switch
                      id="extension-enabled"
                      size="sm"
                      checked={isEnabled}
                      onCheckedChange={() => void toggleEnabled()}
                    />
                  </div>

                  <div className="flex items-center justify-between px-3 py-2 rounded-[var(--pt-radius-md)] transition-colors hover:bg-[var(--pt-hover-bg)]">
                    <Label
                      htmlFor="default-action"
                      className="text-sm font-medium tracking-tight"
                    >
                      Default Action
                    </Label>
                    <Select
                      value={defaultAction === "" ? "__none__" : defaultAction}
                      onValueChange={(v) => void handleDefaultActionChange(v)}
                    >
                      <SelectTrigger
                        id="default-action"
                        aria-label="Default action"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {ACTIONS.map((action) => (
                          <SelectItem key={action.id} value={action.id}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between px-3 py-2 rounded-[var(--pt-radius-md)] transition-colors hover:bg-[var(--pt-hover-bg)]">
                    <div className="flex flex-col gap-0.5">
                      <Label
                        htmlFor="run-on-open"
                        className="text-sm font-medium tracking-tight"
                      >
                        Run on Open
                      </Label>
                      <span
                        id="run-on-open-hint"
                        className="text-xs text-[var(--pt-text-secondary)] leading-snug"
                      >
                        {defaultAction
                          ? "Bypass the palette and run the default action immediately."
                          : "Choose a default action first to enable this."}
                      </span>
                    </div>
                    {defaultAction ? (
                      <Switch
                        id="run-on-open"
                        size="sm"
                        checked={runOnOpen}
                        aria-describedby="run-on-open-hint"
                        onCheckedChange={(checked) =>
                          void handleRunOnOpenChange(checked)
                        }
                      />
                    ) : (
                      <Tooltip
                        content="Choose a default action first"
                        side="left"
                      >
                        <span className="inline-flex">
                          <Switch
                            id="run-on-open"
                            size="sm"
                            checked={runOnOpen}
                            aria-describedby="run-on-open-hint"
                            onCheckedChange={(checked) =>
                              void handleRunOnOpenChange(checked)
                            }
                            disabled
                          />
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ErrorBoundary>
      </div>
    </TooltipPrimitive.Provider>
  );
}
