import { useEffect, useState, useCallback } from "react";
import { Wrench, ArrowClockwise } from "phosphor-react";
import { Button } from "~components/ui/Button";
import { Switch } from "~components/ui/Switch";
import { checkAIAvailability } from "~lib/ai-engine";
import "./styles/globals.css";

// =============================================================================
// Types
// =============================================================================

type Status = "checking" | "ready" | "unavailable" | "needs-download";

// =============================================================================
// Popup Component
// =============================================================================

export default function Popup(): React.JSX.Element {
  const [status, setStatus] = useState<Status>("checking");
  const [isEnabled, setIsEnabled] = useState(true);
  const [ruleCount, setRuleCount] = useState<number | null>(null);

  /**
   * Checks AI availability and database status
   */
  const checkStatus = useCallback(async (): Promise<void> => {
    setStatus("checking");

    try {
      const availability = await checkAIAvailability();

      if (availability.available) {
        setStatus("ready");
      } else if (availability.needsDownload) {
        setStatus("needs-download");
      } else {
        setStatus("unavailable");
      }

      // Check database status
      /* eslint-disable-next-line @typescript-eslint/no-deprecated */
      chrome.runtime.sendMessage(
        { type: "CHECK_DB_STATUS" },
        (response: { ruleCount?: number } | undefined) => {
          if (response?.ruleCount !== undefined) {
            setRuleCount(response.ruleCount);
          }
        },
      );
    } catch (error) {
      console.error("Failed to check AI status:", error);
      setStatus("unavailable");
    }
  }, []);

  /**
   * Loads extension settings from storage
   */
  const loadSettings = useCallback(async (): Promise<void> => {
    /* eslint-disable-next-line @typescript-eslint/no-deprecated */
    const result = await chrome.storage.local.get(["enabled"]);
    setIsEnabled(result.enabled !== false);
  }, []);

  /**
   * Toggles the extension enabled state
   */
  const toggleEnabled = useCallback(async (): Promise<void> => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    /* eslint-disable-next-line @typescript-eslint/no-deprecated */
    await chrome.storage.local.set({ enabled: newValue });
  }, [isEnabled]);

  /**
   * Opens Chrome flags page for enabling Gemini Nano
   */
  const openFlags = useCallback((): void => {
    /* eslint-disable-next-line @typescript-eslint/no-deprecated */
    void chrome.tabs.create({
      url: "chrome://flags/#optimization-guide-on-device-model",
    });
  }, []);

  // Initialize on mount
  useEffect(() => {
    void checkStatus();
    void loadSettings();
  }, [checkStatus, loadSettings]);

  return (
    <div
      className="w-[300px] overflow-hidden rounded-[var(--pt-radius)] border border-[var(--pt-glass-border)] bg-[var(--pt-glass-bg)] text-[var(--pt-text-primary)] [backdrop-filter:var(--pt-glass-blur)]"
      style={{ boxShadow: "var(--pt-shadow), var(--pt-inner-glow)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-[var(--pt-glass-border)] px-5 py-4">
        <Wrench className="h-4.5 w-4.5 text-[var(--pt-text-secondary)]" weight="regular" />
        <h1 className="text-[14px] font-semibold tracking-tight">Prompt Tuner</h1>
      </div>

      <div className="p-1.5 flex flex-col gap-1">
        {/* Status Section */}
        <div className="group flex flex-col gap-3 px-3.5 py-4 transition-colors hover:bg-[var(--pt-hover-bg)] rounded-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--pt-text-secondary)] opacity-80">
              Model Loaded
            </span>
            <button
              onClick={() => void checkStatus()}
              className="rounded-md p-1 text-[var(--pt-text-secondary)] transition-colors hover:text-white"
              title="Refresh status"
            >
              <ArrowClockwise className={status === "checking" ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} weight="regular" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {status === "checking" && (
              <span className="text-[14px] font-medium text-[var(--pt-text-secondary)]">Checking engine...</span>
            )}
            {status === "ready" && (
              <div className="flex items-center gap-2.5 text-[14px] font-medium">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                <span>Ready</span>
              </div>
            )}
            {status === "unavailable" && (
              <div className="flex items-center gap-2.5 text-[14px] font-medium">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                <span className="text-red-400">Not Available</span>
              </div>
            )}
            {status === "needs-download" && (
              <div className="flex items-center gap-2.5 text-[14px] font-medium">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-400">Downloading...</span>
              </div>
            )}
          </div>

          {status === "unavailable" && (
            <Button
              onClick={openFlags}
              variant="outline"
              size="sm"
              className="mt-1 w-full border-[var(--pt-glass-border)] bg-white/5 text-[11px] font-medium hover:bg-white/10"
            >
              Enable Gemini Nano
            </Button>
          )}
        </div>

        {/* Global Toggle */}
        <div className="flex items-center justify-between px-3.5 py-4 transition-colors hover:bg-[var(--pt-hover-bg)] rounded-[10px]">
          <span className="text-[14px] font-medium tracking-tight">Extension Enabled</span>
          <Switch
            checked={isEnabled}
            onCheckedChange={() => void toggleEnabled()}
            className="scale-90"
          />
        </div>

        {/* Stats Section */}
        {ruleCount !== null && (
          <div className="flex items-center justify-between px-3.5 py-4 transition-colors hover:bg-[var(--pt-hover-bg)] rounded-[10px]">
            <span className="text-[14px] font-medium tracking-tight">Active Rules</span>
            <span className="rounded-[4px] bg-white/10 px-1.5 py-0.5 text-[10px] font-mono font-bold text-[var(--pt-text-secondary)]">
              {ruleCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
