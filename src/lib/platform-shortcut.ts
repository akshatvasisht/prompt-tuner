/* eslint-disable @typescript-eslint/no-deprecated */

/**
 * Returns true on macOS, false elsewhere. Coerces undefined platform strings
 * to "" so RegExp.test never receives undefined-as-string-"undefined".
 */
export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as unknown as { userAgentData?: { platform?: string } };
  const platformStr = (nav.userAgentData?.platform ?? navigator.platform) || "";
  return /mac/i.test(platformStr);
}

/**
 * Renders a shortcut hint with the right modifier glyph for the user's OS.
 * `mod` is the platform-aware "Cmd on Mac, Ctrl elsewhere" key.
 *
 * @example
 *   formatShortcut("mod+shift+k") // "⌘⇧K" on Mac, "Ctrl+Shift+K" on Win/Linux
 */
export function formatShortcut(combo: string): string {
  const isMac = isMacPlatform();
  return combo
    .split("+")
    .map((token) => {
      const t = token.trim().toLowerCase();
      if (t === "mod") return isMac ? "⌘" : "Ctrl";
      if (t === "meta" || t === "cmd") return isMac ? "⌘" : "Win";
      if (t === "ctrl") return "Ctrl";
      if (t === "shift") return isMac ? "⇧" : "Shift";
      if (t === "alt" || t === "opt") return isMac ? "⌥" : "Alt";
      if (t === "enter" || t === "return") return "↵";
      if (t === "esc" || t === "escape") return "Esc";
      return token.length === 1 ? token.toUpperCase() : token;
    })
    .join(isMac ? "" : "+");
}
