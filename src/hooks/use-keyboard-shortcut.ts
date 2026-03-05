/* eslint-disable @typescript-eslint/no-deprecated */
import { useEffect } from "react";

export function useKeyboardShortcut(
  keyCombo: string,
  callback: () => void,
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const nav = navigator as unknown as { userAgentData?: { platform?: string } };
      const platformStr = nav.userAgentData?.platform ?? navigator.platform;
      const isMac = /mac/i.test(platformStr);
      const keys = keyCombo.split("+");

      const key = keys[keys.length - 1]?.toLowerCase();
      if (!key) return;

      const needsMod = keys.includes("Mod");
      const needsMeta = keys.includes("Meta");
      const needsCtrl = keys.includes("Ctrl");
      const needsShift = keys.includes("Shift");
      const needsAlt = keys.includes("Alt");

      // Platform-aware "Mod" key (Cmd on Mac, Ctrl on Win/Linux)
      const hasMod = isMac ? event.metaKey : event.ctrlKey;
      const hasMeta = event.metaKey;
      const hasCtrl = event.ctrlKey;
      const hasShift = event.shiftKey;
      const hasAlt = event.altKey;

      const modMatch = !needsMod || hasMod;
      const metaMatch = !needsMeta || hasMeta;
      const ctrlMatch = !needsCtrl || hasCtrl;
      const shiftMatch = !needsShift || hasShift;
      const altMatch = !needsAlt || hasAlt;
      const keyMatch = event.key.toLowerCase() === key;

      if (
        modMatch &&
        metaMatch &&
        ctrlMatch &&
        shiftMatch &&
        altMatch &&
        keyMatch
      ) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [keyCombo, callback]);
}
