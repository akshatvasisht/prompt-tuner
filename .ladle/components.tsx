/* eslint-disable @typescript-eslint/no-explicit-any */
import "@fontsource-variable/inter";
import "../src/styles/globals.css";
import type { GlobalProvider } from "@ladle/react";
import { useEffect } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

/**
 * Ladle global wrapper.
 *
 * Ladle renders each story inside an iframe, so anything we stub has to
 * live on the iframe's window — not the parent. Two things matter:
 *
 * 1. chrome.runtime fake Port, driven by window.__ptMockScript, so the
 *    overlay's port-streaming path works offline.
 * 2. A persistent fake window.getSelection() so getSelectedText() keeps
 *    returning our sample even after the user (or a programmatic click)
 *    collapses the live DOM selection.
 *
 * Both stubs are installed at module-evaluation time — before React
 * mounts the first story — so the overlay never sees an empty chrome
 * or null selection during its initial render.
 */

interface MockMessage {
  type: string;
  [key: string]: unknown;
}

interface MockScript {
  /** Messages the port will emit on receiving a START_OPTIMIZATION. */
  messages: MockMessage[];
  /** Delay in ms between emitted messages. */
  intervalMs?: number;
}

declare global {
  interface Window {
    __ptMockScript?: MockScript;
    __ptMockSelectedText?: string;
    __ptLadleInstalled?: boolean;
  }
}

const DEFAULT_SELECTION =
  "Help me write a compelling product launch announcement for a new privacy-first AI tool.";

function installChromeStub() {
  if ((window as any).chrome?.runtime?.connect) return;

  const listeners = new Set<(msg: any) => void>();
  const disconnectListeners = new Set<() => void>();

  const fakePort = {
    onMessage: {
      addListener: (cb: (m: any) => void) => listeners.add(cb),
      removeListener: (cb: (m: any) => void) => listeners.delete(cb),
    },
    onDisconnect: {
      addListener: (cb: () => void) => disconnectListeners.add(cb),
      removeListener: (cb: () => void) => disconnectListeners.delete(cb),
    },
    postMessage: (msg: any) => {
      if (msg?.type !== "START_OPTIMIZATION") return;
      const script = window.__ptMockScript ?? {
        messages: [
          { type: "COMPLETE", optimizedPrompt: "(no mock script set — check the story's window.__ptMockScript)" },
        ],
        intervalMs: 40,
      };
      const interval = script.intervalMs ?? 40;
      script.messages.forEach((m, i) => {
        setTimeout(() => {
          listeners.forEach((l) => l(m));
        }, interval * (i + 1));
      });
    },
    disconnect: () => {
      disconnectListeners.forEach((l) => l());
      listeners.clear();
      disconnectListeners.clear();
    },
  };

  (window as any).chrome = {
    runtime: {
      connect: () => fakePort,
      getURL: (p: string) => p,
      sendMessage: () => Promise.resolve(),
      onMessage: { addListener: () => undefined, removeListener: () => undefined },
    },
    storage: {
      local: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve(),
      },
    },
  };
}

/**
 * Overrides window.getSelection so getSelectedText() always sees our
 * sample text, regardless of DOM click events. This is safer than
 * maintaining a live Range — clicking anywhere in the overlay would
 * otherwise collapse the live selection and strand the overlay in
 * "no text selected" state.
 */
function installSelectionStub() {
  const getText = () => window.__ptMockSelectedText ?? DEFAULT_SELECTION;

  const fakeSelection = {
    toString: () => getText(),
    rangeCount: 1,
    isCollapsed: false,
    anchorNode: document.body,
    focusNode: document.body,
    getRangeAt: () => {
      const r = document.createRange();
      r.setStart(document.body, 0);
      r.setEnd(document.body, 0);
      return r;
    },
    removeAllRanges: () => undefined,
    addRange: () => undefined,
  };

  const originalGetSelection = window.getSelection.bind(window);
  window.getSelection = () => fakeSelection as unknown as Selection;
  // Retain escape hatch if anything in the harness actually needs the real one.
  (window as any).__ptOriginalGetSelection = originalGetSelection;
}

function installAll() {
  if (typeof window === "undefined") return;
  if (window.__ptLadleInstalled) return;
  window.__ptLadleInstalled = true;
  installChromeStub();
  installSelectionStub();
}

// Run at module load — before any Story function body executes.
installAll();

export const Provider: GlobalProvider = ({ children }) => {
  useEffect(() => {
    // Defensive: re-install if the iframe was reloaded without re-executing
    // this module (shouldn't happen, but cheap to guard).
    installAll();
  }, []);

  // Ladle sets `data-theme="dark|light"` on <html>; globals.css matches that
  // selector directly, so no class-toggle bridge is required here.

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--pt-bg-base)",
        padding: "48px 32px",
        fontFamily: "'Inter Variable', 'Inter', -apple-system, sans-serif",
      }}
    >
      <TooltipPrimitive.Provider delayDuration={600}>
        {children}
      </TooltipPrimitive.Provider>
    </div>
  );
};
