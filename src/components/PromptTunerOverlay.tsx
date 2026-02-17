/* eslint-disable @typescript-eslint/no-deprecated */
import { useEffect, useRef, useState, useCallback } from "react";
import { useKeyboardList } from "~hooks/use-keyboard-list";
import { Tooltip } from "~components/ui/Tooltip";
import { toast } from "sonner";
import { getSelectedText, replaceSelectedText } from "~lib/text-replacer";
import { detectPlatform } from "~lib/platform-detector";
import { cn } from "~lib/utils";

import { ACTIONS } from "~lib/actions";
import { PORT_NAMES, MESSAGE_TYPES, ERROR_MESSAGES } from "~lib/constants";

import { type OptimizePortMessage, type OptimizePortRequest } from "~types";

import { logger } from "~lib/logger";
import { WarningCircle, CheckCircle } from "~lib/icons";

// =============================================================================
// Constants
// =============================================================================

const MAX_INPUT_CHARS = 7200;
const MAX_PREVIEW_CHARS = 60;

const STAGE_LABELS: Record<string, string> = {
  drafting: "Drafting",
  critiquing: "Critiquing",
  polishing: "Polishing",
  chunking: "Splitting",
  mapping: "Analyzing sections",
  reducing: "Stitching",
  shrinking: "Compressing",
  compressing: "Compressing",
  expanding: "Expanding",
  composing: "Composing",
  planning: "Planning",
  writing: "Writing",
  rewriting: "Rewriting",
  cached: "Cached",
};

function humanizeStage(stage: string | null): string {
  if (!stage) return "Streaming";
  return STAGE_LABELS[stage] ?? "Streaming";
}

// =============================================================================
// Module-level undo state (not persisted — cleared on navigation/reload)
// =============================================================================

interface LastApply {
  originalText: string;
  replacedAt: number;
}

let lastApply: LastApply | null = null;

function restoreOriginal(): void {
  if (!lastApply) return;
  const success = replaceSelectedText(lastApply.originalText);
  if (!success) {
    toast.error("Couldn't restore — the input is no longer active.");
  }
  lastApply = null;
}

// =============================================================================
// Component Props
// =============================================================================

export interface CommandPaletteContentProps {
  onClose: () => void;
}

// =============================================================================
// Main Component
// =============================================================================

export function CommandPaletteContent({ onClose }: CommandPaletteContentProps) {
  const [status, setStatus] = useState<
    "selection" | "streaming" | "complete" | "error"
  >("selection");
  const [streamBuffer, setStreamBuffer] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ count: number; limit: number } | null>(null);
  const [stage, setStage] = useState<string | null>(null);

  const portRef = useRef<chrome.runtime.Port | null>(null);
  const streamRef = useRef<HTMLDivElement>(null);
  const chunkBufferRef = useRef<string>("");
  const rafIdRef = useRef<number | null>(null);

  // Cleanup port and RAF on unmount
  useEffect(() => {
    return () => {
      portRef.current?.disconnect();
      portRef.current = null;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Core streaming logic (shared by initial action + retry)
  // ---------------------------------------------------------------------------

  const startStream = useCallback((draft: string, actionId: string) => {
    setStreamBuffer("");
    chunkBufferRef.current = "";
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setStatus("streaming");
    setErrorCode(null);
    setTokenInfo(null);
    setStage(null);

    let completed = false;

    try {
      const port = chrome.runtime.connect({ name: PORT_NAMES.OPTIMIZE });
      portRef.current = port;

      port.onMessage.addListener((message: unknown) => {
        if (!message || typeof message !== "object") {
          logger.error("Received invalid message from optimize port.");
          return;
        }
        const msg = message as OptimizePortMessage;

        if (msg.type === "CHUNK") {
          chunkBufferRef.current += msg.data;
          rafIdRef.current ??= requestAnimationFrame(() => {
            const pending = chunkBufferRef.current;
            chunkBufferRef.current = "";
            rafIdRef.current = null;
            setStreamBuffer((prev) => prev + pending);
          });
        } else if (msg.type === "STAGE") {
          setStage(msg.stage);
        } else if (msg.type === "TOKEN_INFO") {
          if (msg.count > 0) {
            setTokenInfo({ count: msg.count, limit: msg.limit });
          }
        } else if (msg.type === "COMPLETE") {
          completed = true;
          setStreamBuffer(msg.optimizedPrompt);
          setStatus("complete");
          port.disconnect();
        } else if (msg.type === "ERROR") {
          completed = true;
          setErrorCode(msg.code);
          setStatus("error");
          port.disconnect();
        }
      });

      port.onDisconnect.addListener(() => {
        if (!completed) {
          setErrorCode("UNKNOWN_ERROR");
          setStatus("error");
        }
      });

      const request: OptimizePortRequest = {
        type: MESSAGE_TYPES.START_OPTIMIZATION,
        draft: draft.trim(),
        platform: detectPlatform(),
        action: actionId,
      };

      port.postMessage(request);
    } catch {
      logger.error("Overlay optimization error: Something went wrong");
      setErrorCode("UNKNOWN_ERROR");
      setStatus("error");
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Action handler (initial click from palette)
  // ---------------------------------------------------------------------------

  const handleAction = useCallback(
    (actionId: string) => {
      const action = ACTIONS.find((a) => a.id === actionId);
      if (!action) {
        logger.error(`Action with ID ${actionId} not found.`);
        return;
      }

      const selectedText = getSelectedText();
      if (!selectedText?.trim()) {
        setSelectionError(
          "No text selected — highlight the text you want to transform first.",
        );
        return;
      }

      setSelectionError(null);
      setActiveAction(action.label);
      setActiveActionId(action.id);
      setOriginalText(selectedText.trim());

      startStream(selectedText, actionId);
    },
    [startStream],
  );

  // ---------------------------------------------------------------------------
  // Retry handler (shared by "complete" and "error" states)
  // ---------------------------------------------------------------------------

  const handleRetry = useCallback(() => {
    if (!originalText || !activeActionId) return;
    startStream(originalText, activeActionId);
  }, [originalText, activeActionId, startStream]);

  // ---------------------------------------------------------------------------
  // Apply + Undo
  // ---------------------------------------------------------------------------

  const handleApply = useCallback(() => {
    if (!originalText) return;

    // Store for undo before replacing
    lastApply = {
      originalText,
      replacedAt: Date.now(),
    };

    const success = replaceSelectedText(streamBuffer);
    if (success) {
      // Trigger success animation
      setApplySuccess(true);
      setTimeout(() => {
        setApplySuccess(false);
      }, 600);

      // Enhanced toast with success icon
      toast.success("Prompt inserted", {
        icon: <CheckCircle weight="fill" className="pt-status-success" />,
        action: {
          label: "Undo",
          onClick: () => {
            restoreOriginal();
          },
        },
        duration: 8000,
      });

      // Smooth close transition
      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      lastApply = null;
      toast.error("Failed to replace text");
    }
  }, [streamBuffer, originalText, onClose]);

  // ---------------------------------------------------------------------------
  // Enter key handler for ↵ Insert (F7)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && status === "complete") {
        e.preventDefault();
        e.stopPropagation();
        handleApply();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [status, handleApply]);

  // ---------------------------------------------------------------------------
  // Auto-scroll streaming content
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (status === "streaming" && streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [streamBuffer, status]);

  // ===========================================================================
  // Keyboard list navigation for action selection view
  // ===========================================================================

  const allActions = ACTIONS;
  const [showTechniques, setShowTechniques] = useState(false);
  const primaryCount = allActions.filter((a) => a.type === "primary").length;
  const navigableCount = showTechniques ? allActions.length : primaryCount;
  const { activeIndex, setActiveIndex, handleKeyDown: handleListKeyDown } = useKeyboardList({
    count: navigableCount,
    onSelect: (idx) => { handleAction(allActions[idx].id); },
  });

  const handleItemHover = useCallback(
    (idx: number) => () => { setActiveIndex(idx); },
    [setActiveIndex],
  );

  // ===========================================================================
  // Streaming / Complete / Error View
  // ===========================================================================

  if (status === "streaming" || status === "complete" || status === "error") {
    const previewText = originalText
      ? originalText.length > MAX_PREVIEW_CHARS
        ? originalText.slice(0, MAX_PREVIEW_CHARS) + "..."
        : originalText
      : "";

    const isLongInput = originalText
      ? originalText.length > MAX_INPUT_CHARS
      : false;

    return (
      <div className="flex flex-col h-full">
        {/* Header with selection preview */}
        <div className="flex items-start gap-2.5 border-b border-[var(--pt-surface-border)] px-4 py-2.5">
          <span
            className={cn(
              "text-base leading-tight",
              status === "streaming" && "animate-pulse",
            )}
            aria-hidden="true"
            style={{ color: "var(--pt-accent)" }}
          >
            ✱
          </span>
          <div className="min-w-0 flex-1 flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-semibold leading-tight tracking-tight text-[var(--pt-text-primary)]">
                {activeAction}
              </span>
              {status === "streaming" ? (
                <span className="ml-auto font-sans text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--pt-text-tertiary)]">
                  {humanizeStage(stage)}
                </span>
              ) : (
                tokenInfo && tokenInfo.count > 0 && (
                  <span className="ml-auto font-sans text-[10px] font-semibold tracking-[0.18em] uppercase tabular-nums text-[var(--pt-text-tertiary)]" title="Input tokens consumed vs model limit">
                    {tokenInfo.count} / {tokenInfo.limit}
                  </span>
                )
              )}
            </div>
            {/* Selection preview subtitle */}
            <span className="text-xs text-[var(--pt-text-secondary)] truncate leading-snug">
              {previewText}
            </span>
            {/* Long input warning */}
            {isLongInput && (
              <span className="text-xs font-medium pt-status-warning">
                Long input — model may truncate
              </span>
            )}
          </div>
        </div>

        {/* Content area */}
        {status === "error" ? (
          /* Inline error panel */
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-3 px-4 py-3"
          >
            <WarningCircle className="h-4 w-4 mt-0.5 shrink-0 pt-status-error" weight="fill" />
            <div className="min-w-0 flex-1 flex flex-col gap-2">
              <p className="text-sm text-[var(--pt-text-primary)] leading-snug">
                {ERROR_MESSAGES[errorCode ?? "UNKNOWN_ERROR"] ??
                  ERROR_MESSAGES.UNKNOWN_ERROR}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRetry}
                  className="-mx-1 -my-1.5 px-1 py-1.5 text-sm font-semibold text-[var(--pt-accent)] hover:text-[var(--pt-accent-hover)] transition-colors"
                >
                  Try again
                </button>
                <span aria-hidden className="text-[var(--pt-text-tertiary)]">·</span>
                <button
                  onClick={() => {
                    portRef.current?.disconnect();
                    portRef.current = null;
                    setStatus("selection");
                    setErrorCode(null);
                  }}
                  className="-mx-1 -my-1.5 px-1 py-1.5 text-sm font-medium text-[var(--pt-text-secondary)] hover:text-[var(--pt-text-primary)] transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Stream buffer */
          <div
            ref={streamRef}
            className="flex-1 overflow-y-auto px-4 py-3"
            aria-live="polite"
            aria-atomic="false"
          >
            <p className="whitespace-pre-wrap text-sm leading-normal text-[var(--pt-text-primary)] font-normal">
              {streamBuffer}
              {status === "streaming" && (
                <span className="ml-1 inline-block h-[0.9lh] w-[3px] bg-[var(--pt-accent)] align-middle opacity-80" />
              )}
            </p>
          </div>
        )}

        {/* Action bar */}
        {status !== "error" && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--pt-surface-border)]">
            <button
              onClick={() => {
                portRef.current?.disconnect();
                portRef.current = null;
                setStatus("selection");
                setErrorCode(null);
              }}
              className="-mx-1 -my-1.5 px-1 py-1.5 text-sm font-medium text-[var(--pt-text-secondary)] hover:text-[var(--pt-text-primary)] transition-colors"
            >
              {status === "streaming" ? "Stop" : "Cancel"}
            </button>

            {status === "complete" && (
              <div className="flex items-center gap-3">
                <Tooltip content="Retry optimization">
                  <button
                    onClick={handleRetry}
                    className="-mx-1 -my-1.5 px-1 py-1.5 text-sm font-medium text-[var(--pt-text-secondary)] hover:text-[var(--pt-text-primary)] transition-colors"
                  >
                    Retry
                  </button>
                </Tooltip>
                <span aria-hidden className="text-[var(--pt-text-tertiary)]">·</span>
                <Tooltip content="Insert optimized prompt (↵)">
                  <button
                    onClick={handleApply}
                    aria-label="Insert optimized prompt into text field"
                    className={cn(
                      "-mx-1 -my-1.5 flex items-center gap-2 px-1 py-1.5 text-sm font-semibold leading-none transition-colors",
                      applySuccess
                        ? "pt-status-success"
                        : "text-[var(--pt-accent)] hover:text-[var(--pt-accent-hover)]"
                    )}
                  >
                    {applySuccess ? (
                      <>
                        <CheckCircle className="h-4 w-4" weight="fill" />
                        Applied
                      </>
                    ) : (
                      <>
                        Insert
                        <span aria-hidden className="font-sans text-sm">↵</span>
                      </>
                    )}
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // Action Selection View
  // ===========================================================================

  return (
    <>
      {/* Selection error inline */}
      {selectionError && (
        <div className="px-4 py-2.5 text-sm font-medium pt-status-error pt-status-error-bg border-b border-[var(--pt-surface-border)]">
          {selectionError}
        </div>
      )}

      <ul
        id="pt-techniques-list"
        role="listbox"
        aria-label="Prompt actions"
        tabIndex={0}
        aria-activedescendant={`pt-action-${String(activeIndex)}`}
        onKeyDown={handleListKeyDown}
        className="max-h-[var(--pt-list-max-h)] overflow-y-hidden py-2 outline-none"
      >
        {allActions.filter((a) => a.type === "primary").map((action, idx) => {
          const selected = activeIndex === idx;
          return (
            <li
              key={action.id}
              id={`pt-action-${String(idx)}`}
              role="option"
              aria-selected={selected}
              tabIndex={-1}
              onClick={() => {
                setActiveIndex(idx);
                handleAction(action.id);
              }}
              onMouseEnter={handleItemHover(idx)}
              className={cn(
                "pt-action-item mx-2 flex cursor-pointer items-center gap-2.5 rounded-[var(--pt-radius-sm)] px-3 py-2",
                "transition-colors duration-100",
                selected
                  ? "bg-[var(--pt-accent)] text-white"
                  : "text-[var(--pt-text-primary)] hover:bg-[var(--pt-hover-bg)]",
              )}
            >
              <span
                className={cn(
                  "text-base leading-none",
                  selected ? "text-white" : "text-[var(--pt-accent)]",
                )}
                aria-hidden="true"
              >
                ✱
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold leading-tight tracking-tight">
                  {action.label}
                </div>
                <div
                  className={cn(
                    "truncate text-xs leading-snug",
                    selected ? "text-white/80" : "text-[var(--pt-text-secondary)]",
                  )}
                >
                  {action.description}
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 font-sans text-xs leading-none",
                  selected ? "text-white/70" : "text-[var(--pt-text-tertiary)]",
                )}
                aria-hidden="true"
              >
                ↵
              </span>
            </li>
          );
        })}

        <li role="presentation" className="mt-1.5 mb-0.5 px-2">
          <button
            type="button"
            onClick={() => { setShowTechniques((v) => !v); }}
            aria-expanded={showTechniques}
            aria-controls="pt-techniques-list"
            className="group flex w-full items-center gap-2 px-1 py-2 text-left transition-colors hover:text-[var(--pt-accent)]"
          >
            <span className="font-sans text-[10px] font-semibold tracking-[0.22em] uppercase text-[var(--pt-accent)]">
              Techniques
            </span>
            <span
              aria-hidden="true"
              className="h-px flex-1 bg-[var(--pt-surface-border)]"
            />
            <span
              aria-hidden="true"
              className={cn(
                "text-xs text-[var(--pt-text-tertiary)] transition-transform duration-150",
                showTechniques ? "rotate-90" : "rotate-0",
              )}
            >
              ›
            </span>
          </button>
        </li>

        {showTechniques && allActions
          .filter((a) => a.type === "secondary")
          .map((action, i) => {
            const idx = i + allActions.filter((a) => a.type === "primary").length;
            const selected = activeIndex === idx;
            return (
              <li
                key={action.id}
                id={`pt-action-${String(idx)}`}
                role="option"
                aria-selected={selected}
                tabIndex={-1}
                onClick={() => {
                  setActiveIndex(idx);
                  handleAction(action.id);
                }}
                onMouseEnter={handleItemHover(idx)}
                className={cn(
                  "pt-action-item mx-2 flex cursor-pointer items-baseline gap-2.5 rounded-[var(--pt-radius-sm)] px-3 py-2",
                  "transition-colors duration-100",
                  selected
                    ? "bg-[var(--pt-accent)] text-white"
                    : "text-[var(--pt-text-primary)] hover:bg-[var(--pt-hover-bg)]",
                )}
              >
                <span
                  className={cn(
                    "w-4 shrink-0 text-xs font-semibold leading-none tabular-nums",
                    selected ? "text-white/70" : "text-[var(--pt-accent)]",
                  )}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1 truncate">
                  <span className="text-sm font-medium leading-tight">
                    {action.label}
                  </span>
                  <span
                    className={cn(
                      "ml-2 text-xs leading-snug",
                      selected ? "text-white/70" : "text-[var(--pt-text-tertiary)]",
                    )}
                  >
                    {action.description}
                  </span>
                </div>
              </li>
            );
          })}
      </ul>
    </>
  );
}
