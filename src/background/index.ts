/**
 * Background Service Worker for Prompt Tuner
 *
 * Handles:
 * - Extension installation and updates
 * - Message routing
 * - Keep-alive for MV3 service workers
 */

import { getRuleCount } from "~lib/platform-rules"

// =============================================================================
// Types
// =============================================================================

interface BackgroundMessage {
  type: "PING" | "CHECK_STATUS"
}

// =============================================================================
// Extension Lifecycle Events
// =============================================================================

/* eslint-disable @typescript-eslint/no-deprecated */
chrome.runtime.onInstalled.addListener((details): void => {
  void (async (): Promise<void> => {
    try {
      const ruleCount = getRuleCount()

      await chrome.storage.local.set({
        installedAt: Date.now(),
        lastUpdated: Date.now(),
        version: chrome.runtime.getManifest().version,
      })

      if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        // eslint-disable-next-line no-console
        console.log(`[Background] Fresh installation - ${String(ruleCount)} rules bundled`)
      }
    } catch (error: unknown) {
      console.error("[Background] Failed to initialize:", error)
    }
  })()
})

// =============================================================================
// Message Handling
// =============================================================================

chrome.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
  switch (message.type) {
    case "PING":
      sendResponse({ type: "PONG", ready: true })
      return true

    case "CHECK_STATUS":
      sendResponse({
        ready: true,
        ruleCount: getRuleCount(),
      })
      return true

    default:
      return false
  }
})

// =============================================================================
// Keep Alive (MV3 Service Workers)
// =============================================================================

const KEEP_ALIVE_ALARM = "prompt-tuner-keep-alive"

try {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === KEEP_ALIVE_ALARM) {
      // Keep service worker active
    }
  })
} catch (error: unknown) {
  console.error("[Background] Failed to set up alarms listener:", error)
}

/**
 * Sets or clears the keep-alive alarm for the service worker
 */
export function setKeepAlive(active: boolean): void {
  if (active) {
    void chrome.alarms.create(KEEP_ALIVE_ALARM, { periodInMinutes: 0.5 })
  } else {
    void chrome.alarms.clear(KEEP_ALIVE_ALARM)
  }
}
/* eslint-enable @typescript-eslint/no-deprecated */
