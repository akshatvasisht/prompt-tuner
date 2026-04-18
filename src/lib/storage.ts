/**
 * Thin wrapper over `chrome.storage.local`.
 *
 * Centralizes the @typescript-eslint/no-deprecated suppression at the module
 * boundary so call sites stay clean. All popup/content settings should route
 * through these helpers rather than touching chrome.storage directly.
 */

/* eslint-disable @typescript-eslint/no-deprecated */

export const storage = {
  get: (keys: string | string[]): Promise<Record<string, unknown>> =>
    chrome.storage.local.get(keys),
  set: (items: Record<string, unknown>): Promise<void> =>
    chrome.storage.local.set(items),
};

export const tabs = {
  create: (url: string): Promise<chrome.tabs.Tab> =>
    chrome.tabs.create({ url }),
};
