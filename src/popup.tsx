/**
 * Extension Popup UI
 *
 * Displays:
 * - AI availability status
 * - Quick settings toggle
 * - Extension info
 */

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "~components/ui/button";
import { checkAIAvailability } from "~lib/ai-engine";
import { cn } from "~lib/utils";
import { type AIAvailability } from "~types";
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
  const [aiInfo, setAiInfo] = useState<AIAvailability | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [ruleCount, setRuleCount] = useState<number | null>(null);

  /**
   * Checks AI availability and database status
   */
  const checkStatus = useCallback(async (): Promise<void> => {
    setStatus("checking");

    try {
      const availability = await checkAIAvailability();
      setAiInfo(availability);

      if (availability.available) {
        setStatus("ready");
      } else if (availability.needsDownload) {
        setStatus("needs-download");
      } else {
        setStatus("unavailable");
      }

      // Check database status
      // eslint-disable-next-line @typescript-eslint/no-deprecated
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
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const result = (await chrome.storage.local.get(["enabled"])) as {
      enabled?: boolean;
    };
    setIsEnabled(result.enabled !== false);
  }, []);

  /**
   * Toggles the extension enabled state
   */
  const toggleEnabled = useCallback(async (): Promise<void> => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    await chrome.storage.local.set({ enabled: newValue });
  }, [isEnabled]);

  /**
   * Opens Chrome flags page for enabling Gemini Nano
   */
  const openFlags = useCallback((): void => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
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
    <div className="w-80 p-4 bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Prompt Tuner</h1>
          <p className="text-xs text-muted-foreground">
            Optimize your prompts locally
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className="mb-4 p-3 rounded-lg bg-muted/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">AI Status</span>
          <button
            onClick={() => void checkStatus()}
            className="p-1 hover:bg-muted rounded"
            title="Refresh status"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {status === "checking" && (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Checking...</span>
            </>
          )}
          {status === "ready" && (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">
                Gemini Nano Ready
              </span>
            </>
          )}
          {status === "unavailable" && (
            <>
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">
                Not Available
              </span>
            </>
          )}
          {status === "needs-download" && (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-600 dark:text-amber-400">
                Downloading...
              </span>
            </>
          )}
        </div>

        {aiInfo?.reason && status !== "ready" && (
          <p className="mt-2 text-xs text-muted-foreground">{aiInfo.reason}</p>
        )}

        {status === "unavailable" && (
          <Button
            onClick={openFlags}
            variant="outline"
            size="sm"
            className="mt-3 w-full"
          >
            Enable in Chrome Flags
          </Button>
        )}
      </div>

      {/* Settings */}
      <div className="mb-4 p-3 rounded-lg bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Extension Enabled</span>
            <p className="text-xs text-muted-foreground">
              Show optimization widget
            </p>
          </div>
          <button
            onClick={() => void toggleEnabled()}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors",
              isEnabled ? "bg-primary" : "bg-muted-foreground/30",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                isEnabled && "translate-x-5",
              )}
            />
          </button>
        </div>
      </div>

      {/* Stats */}
      {ruleCount !== null && (
        <div className="mb-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Optimization Rules</span>
            <span className="text-sm font-semibold text-primary">
              {ruleCount}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Platform-specific rules loaded
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-border">
        <p className="text-xs text-center text-muted-foreground">
          100% local processing • Zero cloud uploads
        </p>
      </div>
    </div>
  );
}
