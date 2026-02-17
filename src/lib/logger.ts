/**
 * Centralized Logging Utility
 * Following industry standards for extension logging:
 * 1. Prefixed messages for easy filtering
 * 2. Environment-aware (could disable in production)
 * 3. Consistent format
 */

const PREFIX = "[PromptTuner]";

/* eslint-disable no-console */
export const logger = {
    info: (message: string, ...args: unknown[]) => {
        console.log(`${PREFIX} 🔵 INFO: ${message}`, ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
        console.warn(`${PREFIX} 🟠 WARN: ${message}`, ...args);
    },
    error: (message: string, ...args: unknown[]) => {
        console.error(`${PREFIX} 🔴 ERROR: ${message}`, ...args);
    },
    debug: (message: string, ...args: unknown[]) => {
        // Safe check for process.env in various environments
        const isDev = typeof process !== "undefined" && process.env.NODE_ENV === "development";
        if (isDev) {
            console.debug(`${PREFIX} ⚪ DEBUG: ${message}`, ...args);
        }
    },
};
