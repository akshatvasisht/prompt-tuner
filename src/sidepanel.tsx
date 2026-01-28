/**
 * Side Panel - Main UI for Prompt Tuner
 *
 * Features:
 * - State machine: idle → ready → streaming → complete → idle
 * - Storage-based communication with content script
 * - Real-time streaming preview
 * - Editable result before accepting
 * - Statistics display (rules applied, character delta)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Wrench,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "~components/ui/button";
import { cn } from "~lib/utils";
import "./styles/globals.css";

// =============================================================================
// Types
// =============================================================================

type PanelStatus = "idle" | "ready" | "streaming" | "complete" | "error";

interface DraftPayload {
  draftText: string;
  sourceTabId: number;
  platform: string;
  timestamp: number;
}

interface PanelState {
  status: PanelStatus;
  originalText: string;
  optimizedText: string;
  streamBuffer: string;
  sourceTabId: number | null;
  platform: string;
  appliedRules: string[];
  errorMessage?: string;
}

// =============================================================================
// Side Panel Component
// =============================================================================

export default function SidePanel(): React.JSX.Element {
  const [state, setState] = useState<PanelState>({
    status: "idle",
    originalText: "",
    optimizedText: "",
    streamBuffer: "",
    sourceTabId: null,
    platform: "unknown",
    appliedRules: [],
  });

  const [editedText, setEditedText] = useState("");
  const [copied, setCopied] = useState(false);

  const portRef = useRef<chrome.runtime.Port | null>(null);
  const isMountedRef = useRef(true);

  // =============================================================================
  // Lifecycle
  // =============================================================================

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Disconnect port on unmount
      if (portRef.current) {
        try {
          portRef.current.disconnect();
        } catch {
          // Port may already be disconnected
        }
        portRef.current = null;
      }
    };
  }, []);

  // =============================================================================
  // Storage Listener - Detects new drafts from content script
  // =============================================================================

  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ): void => {
      // Listen for session storage changes (ephemeral data)
      if (areaName !== "session") return;

      if (changes.currentDraft) {
        const draft = changes.currentDraft.newValue as
          | DraftPayload
          | undefined;

        if (draft && isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            status: "ready",
            originalText: draft.draftText,
            sourceTabId: draft.sourceTabId,
            platform: draft.platform,
            optimizedText: "",
            streamBuffer: "",
            appliedRules: [],
            errorMessage: undefined,
          }));

          setEditedText("");
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Check for existing draft on mount
    void chrome.storage.session.get(["currentDraft"]).then((result) => {
      const draft = result.currentDraft as DraftPayload | undefined;
      if (draft && isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          status: "ready",
          originalText: draft.draftText,
          sourceTabId: draft.sourceTabId,
          platform: draft.platform,
        }));
      }
    });

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // =============================================================================
  // Optimization Flow
  // =============================================================================

  const handleOptimize = useCallback((): void => {
    if (state.status !== "ready" || !state.originalText.trim()) return;

    setState((prev) => ({
      ...prev,
      status: "streaming",
      streamBuffer: "",
      optimizedText: "",
      errorMessage: undefined,
    }));

    // Open long-lived port for streaming
    const port = chrome.runtime.connect({ name: "optimize-port" });
    portRef.current = port;

    let fullOptimizedText = "";

    // Set up port message listener for streaming chunks
    const handlePortMessage = (message: unknown): void => {
      if (!message || typeof message !== "object") return;

      const msg = message as Record<string, unknown>;

      if (msg.type === "CHUNK") {
        // Accumulate streamed text
        const chunk = msg.data as string;
        fullOptimizedText += chunk;

        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            streamBuffer: fullOptimizedText,
          }));
        }
      } else if (msg.type === "COMPLETE") {
        // Optimization complete
        const optimizedPrompt = msg.optimizedPrompt as string;
        const appliedRules = (msg.appliedRules as string[]) ?? [];

        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            status: "complete",
            optimizedText: optimizedPrompt,
            streamBuffer: "",
            appliedRules,
          }));

          setEditedText(optimizedPrompt);
        }

        // Disconnect port
        if (portRef.current) {
          try {
            portRef.current.disconnect();
          } catch {
            // Already disconnected
          }
          portRef.current = null;
        }
      } else if (msg.type === "ERROR") {
        // Error occurred
        const errorMessage = (msg.message as string) ?? "Optimization failed";

        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            status: "error",
            errorMessage,
            streamBuffer: "",
          }));
        }

        // Disconnect port
        if (portRef.current) {
          try {
            portRef.current.disconnect();
          } catch {
            // Already disconnected
          }
          portRef.current = null;
        }
      }
    };

    port.onMessage.addListener(handlePortMessage);

    // Handle port disconnect
    port.onDisconnect.addListener(() => {
      if (isMountedRef.current && state.status === "streaming") {
        setState((prev) => ({
          ...prev,
          status: "error",
          errorMessage: "Connection lost during optimization",
        }));
      }
    });

    // Send optimization request
    port.postMessage({
      type: "START_OPTIMIZATION",
      draft: state.originalText,
      platform: state.platform,
    });
  }, [state.status, state.originalText, state.platform]);

  // =============================================================================
  // Accept Flow - Inject text back to content script
  // =============================================================================

  const handleAccept = useCallback((): void => {
    if (state.status !== "complete" || !state.sourceTabId) return;

    const finalText = editedText || state.optimizedText;

    // Send message to background to inject text
    chrome.runtime.sendMessage(
      {
        type: "INJECT_TEXT",
        tabId: state.sourceTabId,
        text: finalText,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "[SidePanel] Failed to inject text:",
            chrome.runtime.lastError,
          );
          if (isMountedRef.current) {
            setState((prev) => ({
              ...prev,
              status: "error",
              errorMessage: "Failed to inject text. Tab may have closed.",
            }));
          }
          return;
        }

        // Success - reset to idle
        if (isMountedRef.current) {
          setState({
            status: "idle",
            originalText: "",
            optimizedText: "",
            streamBuffer: "",
            sourceTabId: null,
            platform: "unknown",
            appliedRules: [],
          });
          setEditedText("");
        }

        // Clear draft from storage
        void chrome.storage.session.remove(["currentDraft"]);
      },
    );
  }, [state.status, state.sourceTabId, state.optimizedText, editedText]);

  // =============================================================================
  // Cancel Flow
  // =============================================================================

  const handleCancel = useCallback((): void => {
    // Disconnect port if streaming
    if (portRef.current) {
      try {
        portRef.current.disconnect();
      } catch {
        // Already disconnected
      }
      portRef.current = null;
    }

    // Reset to idle
    setState({
      status: "idle",
      originalText: "",
      optimizedText: "",
      streamBuffer: "",
      sourceTabId: null,
      platform: "unknown",
      appliedRules: [],
    });

    setEditedText("");

    // Clear draft from storage
    void chrome.storage.session.remove(["currentDraft"]);
  }, []);

  // =============================================================================
  // Copy to Clipboard
  // =============================================================================

  const handleCopy = useCallback((): void => {
    const textToCopy = editedText || state.optimizedText;
    void navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [editedText, state.optimizedText]);

  // =============================================================================
  // Computed Values
  // =============================================================================

  const characterDelta =
    state.optimizedText.length - state.originalText.length;
  const displayText =
    state.status === "streaming" ? state.streamBuffer : editedText;

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="brutal-header flex items-center gap-3 p-4">
        <Wrench className="w-6 h-6 text-black" />
        <div className="flex-1">
          <h1 className="text-lg font-bold text-black">Prompt Tuner</h1>
          <p className="text-xs text-black/70">
            {state.platform !== "unknown"
              ? `Optimizing for ${state.platform}`
              : "Local AI optimization"}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Idle State */}
        {state.status === "idle" && (
          <div className="h-full flex items-center justify-center text-center text-muted-foreground">
            <div>
              <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                Click the tune button on a textarea to start optimizing
              </p>
            </div>
          </div>
        )}

        {/* Ready State */}
        {state.status === "ready" && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Original Text
              </label>
              <div data-testid="panel-original-text" className="p-3 border-2 border-black rounded bg-muted/50 max-h-40 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">
                  {state.originalText}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {state.originalText.length} characters
              </p>
            </div>

            <Button
              data-testid="panel-optimize-button"
              onClick={handleOptimize}
              className="w-full brutal-button bg-primary hover:bg-primary/90 text-black font-semibold"
              size="lg"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Optimize Prompt
            </Button>
          </>
        )}

        {/* Streaming State */}
        {state.status === "streaming" && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Original Text
              </label>
              <div className="p-3 border-2 border-black rounded bg-muted/50 max-h-32 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {state.originalText}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Wrench className="w-4 h-4 animate-wiggle" />
                Generating...
              </label>
              <div className="p-3 border-2 border-black rounded bg-background min-h-32 max-h-64 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">
                  {state.streamBuffer}
                  <span className="inline-block w-1 h-4 bg-primary animate-pulse ml-0.5" />
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {state.streamBuffer.length} characters generated
              </p>
            </div>
          </>
        )}

        {/* Complete State */}
        {state.status === "complete" && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Original Text
              </label>
              <div className="p-3 border-2 border-black rounded bg-muted/50 max-h-32 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {state.originalText}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center justify-between">
                <span>Optimized Text (Editable)</span>
                <Button
                  onClick={handleCopy}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                >
                  {copied ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </label>
              <textarea
                data-testid="panel-optimized-text"
                value={displayText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full p-3 border-2 border-black rounded bg-background min-h-64 text-sm font-mono focus:ring-2 focus:ring-black focus:ring-offset-2"
                placeholder="Optimized text will appear here..."
              />
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span>{displayText.length} characters</span>
                <span
                  className={cn(
                    "font-medium",
                    characterDelta > 0 && "text-green-600",
                    characterDelta < 0 && "text-red-600",
                  )}
                >
                  {characterDelta > 0 ? "+" : ""}
                  {characterDelta} chars
                </span>
              </div>
            </div>

            {/* Statistics */}
            {state.appliedRules.length > 0 && (
              <div data-testid="panel-stats" className="p-3 border-2 border-black rounded bg-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {state.appliedRules.length} rules applied
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                data-testid="panel-accept-button"
                onClick={handleAccept}
                className="flex-1 brutal-button bg-green-500 hover:bg-green-600 text-white font-semibold"
                size="lg"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept
              </Button>
              <Button
                data-testid="panel-cancel-button"
                onClick={handleCancel}
                variant="outline"
                className="flex-1 brutal-button"
                size="lg"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </>
        )}

        {/* Error State */}
        {state.status === "error" && (
          <>
            {state.originalText && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Original Text
                </label>
                <div className="p-3 border-2 border-black rounded bg-muted/50 max-h-32 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {state.originalText}
                  </p>
                </div>
              </div>
            )}

            <div className="p-4 border-2 border-red-500 rounded bg-red-50 dark:bg-red-950">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-600">Error</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                {state.errorMessage ?? "An unknown error occurred"}
              </p>
            </div>

            <div className="flex gap-2">
              {state.originalText && (
                <Button
                  onClick={() =>
                    setState((prev) => ({ ...prev, status: "ready" }))
                  }
                  className="flex-1 brutal-button bg-primary hover:bg-primary/90 text-black"
                >
                  Retry
                </Button>
              )}
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 brutal-button"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-muted/30">
        <p className="text-xs text-center text-muted-foreground">
          100% local processing • Zero cloud uploads
        </p>
      </div>
    </div>
  );
}
