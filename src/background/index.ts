/**
 * Background Service Worker for Prompt Tuner
 *
 * Handles:
 * - Extension installation and updates
 * - Vector database initialization
 * - Message routing
 */

import { initializeDatabase, seedDatabase, isDatabaseReady, getRuleCount } from "~lib/vector-db"

// =============================================================================
// Types
// =============================================================================

interface BackgroundMessage {
  type: "PING" | "CHECK_DB_STATUS" | "RESET_DATABASE"
}

// =============================================================================
// Extension Lifecycle Events
// =============================================================================

/* eslint-disable @typescript-eslint/no-deprecated */
chrome.runtime.onInstalled.addListener((details): void => {
  void (async (): Promise<void> => {
    try {
      await initializeDatabase()
      await seedDatabase()
      const ruleCount = await getRuleCount()

      await chrome.storage.local.set({
        installedAt: Date.now(),
        lastUpdated: Date.now(),
        version: chrome.runtime.getManifest().version,
      })

      if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        // eslint-disable-next-line no-console
        console.log(`[Background] Fresh installation - ${String(ruleCount)} rules loaded`)
      }
    } catch (error: unknown) {
      console.error("[Background] Failed to initialize:", error)
    }
  })()
})

chrome.runtime.onStartup.addListener(() => {
  void (async () => {
    try {
      if (!isDatabaseReady()) {
        await initializeDatabase()
        await seedDatabase()
      }
    } catch (error: unknown) {
      console.error("[Background] Startup initialization failed:", error)
    }
  })()
})

// =============================================================================
// Message Handling
// =============================================================================

chrome.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
  switch (message.type) {
    case "PING":
      sendResponse({ type: "PONG", ready: isDatabaseReady() })
      return true

    case "CHECK_DB_STATUS":
      getRuleCount()
        .then(count => {
          sendResponse({
            ready: isDatabaseReady(),
            ruleCount: count,
          })
        })
        .catch((error: unknown) => {
          sendResponse({
            ready: false,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        })
      return true

    case "RESET_DATABASE":
      initializeDatabase()
        .then(() => seedDatabase())
        .then(() => getRuleCount())
        .then(count => {
          sendResponse({ success: true, ruleCount: count })
        })
        .catch((error: unknown) => {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          })
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
  chrome.alarms.onAlarm.addListener(alarm => {
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

export { initializeDatabase, seedDatabase, isDatabaseReady }
