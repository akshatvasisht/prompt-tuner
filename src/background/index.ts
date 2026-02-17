/* eslint-disable @typescript-eslint/no-deprecated */
/**
 * Background Service Worker for Prompt Tuner
 *
 * Handles:
 * - Extension installation and updates
 * - Message routing (single-fire and long-lived ports)
 * - Keep-alive for MV3 service workers
 * - Port-based streaming for AI optimization
 */

import { registerOptimizePortHandler } from "./messages/optimize-port";
import { getRuleCount, initializeRules } from "~lib/platform-rules";
import { logger } from "~lib/logger";
import { STORAGE_KEYS, MESSAGE_TYPES, ALARM_NAMES, COMMAND_IDS } from "~lib/constants";



// =============================================================================
// Extension Lifecycle Events
// =============================================================================

chrome.runtime.onInstalled.addListener((details) => {
  void (async (): Promise<void> => {
    try {
      // Initialize rules (fetch remote or use bundled)
      await initializeRules();

      const ruleCount = getRuleCount();

      await chrome.storage.local.set({
        [STORAGE_KEYS.INSTALLED_AT]: Date.now(),
        [STORAGE_KEYS.LAST_UPDATED]: Date.now(),
        [STORAGE_KEYS.VERSION]: chrome.runtime.getManifest().version,
      });

      if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        logger.info(
          `Fresh installation - ${String(ruleCount)} rules loaded`,
        );
      } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        logger.info(
          `Extension updated - ${String(ruleCount)} rules loaded`,
        );
      }
    } catch (error: unknown) {
      logger.error("Failed to initialize background script:", error);
    }
  })();
});

// =============================================================================
// Message Handling
// =============================================================================

import type { ExtensionMessage } from "~types";

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (typeof message !== "object") {
      return false;
    }

    switch (message.type) {
      case MESSAGE_TYPES.PING:
        sendResponse({ type: MESSAGE_TYPES.PONG, ready: true });
        return true;

      case "CHECK_STATUS":
      case "CHECK_DB_STATUS":
        sendResponse({
          ready: true,
          ruleCount: getRuleCount(),
        });
        return true;

      default:
        return false;
    }
  },
);

// =============================================================================
// Keyboard Command (Toggle Overlay)
// =============================================================================

chrome.commands.onCommand.addListener((command) => {
  if (command === COMMAND_IDS.TOGGLE_OVERLAY) {
    void chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId != null) {
        void chrome.tabs.sendMessage(tabId, { type: "TOGGLE_OVERLAY" });
      }
    });
  }
});

// =============================================================================
// Keep Alive (MV3 Service Workers)
// =============================================================================

try {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAMES.KEEP_ALIVE) {
      // Keep service worker active
    }
  });
} catch (error: unknown) {
  logger.error("Failed to set up alarms listener:", error);
}

/**
 * Sets or clears the keep-alive alarm for the service worker
 */
export function setKeepAlive(active: boolean): void {
  if (active) {
    void chrome.alarms.create(ALARM_NAMES.KEEP_ALIVE, { periodInMinutes: 0.5 });
  } else {
    void chrome.alarms.clear(ALARM_NAMES.KEEP_ALIVE);
  }
}

// =============================================================================
// Port Handlers Registration
// =============================================================================

// Register the optimize port handler for streaming support
registerOptimizePortHandler();
