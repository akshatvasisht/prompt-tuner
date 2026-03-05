# Prompt Tuner Internal APIs

This document outlines the internal messaging contracts, AI Engine interfaces, and core types used within the Prompt Tuner Chrome extension.

## 1. Extension Messaging System (`chrome.runtime.sendMessage`)

The extension uses a strictly typed message passing system defined by the `ExtensionMessage` union.

### `MESSAGE_TYPES`

- `TOGGLE_OVERLAY`: Dispatched to content scripts to open/close the command palette.
- `START_OPTIMIZATION`: (Legacy) Used for one-shot optimizations before streaming was introduced.
- `REPLACE_TEXT`: Command sent from overlay to content script to replace DOM text.
- `REFRESH_RULES`: Sent from popup to background to trigger a remote fetch of the latest optimization rules.

### Message Payloads

```typescript
// Example: Requesting a rules refresh
chrome.runtime.sendMessage({ type: "REFRESH_RULES" }, (response) => {
  if (response.success) {
    console.log(`Updated rules count: ${response.ruleCount}`);
  }
});
```

---

## 2. Port-Based Streaming (`chrome.runtime.connect`)

Long-lived operations like AI optimization use `chrome.runtime.Port` to stream chunks back to the UI incrementally and avoid service worker termination.

### Port Name

```typescript
PORT_NAMES.OPTIMIZE = "optimize-port";
```

### Request Structure (`OptimizePortRequest`)

Sent from the overlay component to the background service worker:

```typescript
{
  type: "START_OPTIMIZATION",
  draft: string,         // The selected text from the host page
  platform: Platform,    // 'openai' | 'anthropic' | 'google'
  action: string,        // e.g., 'chain-of-thought', 'few-shot'
}
```

### Response Chunks (`OptimizePortMessage`)

Streamed from background back to the overlay:

```typescript
// Emitted repeatedly during generation
{ type: "CHUNK", data: string }

// Emitted once when generation completes successfully
{ type: "COMPLETE", optimizedPrompt: string, appliedRules: string[] }

// Emitted if an error halts generation
{ type: "ERROR", code: ErrorCode, message: string }
```

---

## 3. Storage Keys (`chrome.storage.local`)

Settings and cached rules are preserved locally.

| Key                      | Purpose                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `settings.enabled`       | Global on/off switch for the extension injections                                                   |
| `settings.showWidget`    | Toggles the MiniPillTrigger                                                                         |
| `settings.defaultAction` | The `actionId` of the default transformation (e.g. `optimize`)                                      |
| `settings.runOnOpen`     | Boolean: if true and defaultAction is set, bypasses palette and runs action immediately on shortcut |
| `rules_cache_{platform}` | Locally cached Zod-validated rule objects fetched from the remote registry                          |

---

## 4. AI Engine Module (`~lib/ai-engine`)

A high-level abstraction over the native Chrome `window.ai.languageModel` API.

### `checkAIAvailability(): Promise<AIAvailability>`

Checks if the Gemini Nano model is active, ready, or needs downloading.

### `warmup(rules?: OptimizationRule[]): Promise<void>`

Initializes a new `LanguageModel` session. If pre-warmed with specific rules in the system prompt, subsequent calls are much faster.

### `optimizePromptStreaming(draft, context, options, onChunk)`

The core generation function. Emits tokens incrementally via the `onChunk` callback.

---

## 5. Platform Detection & Injection

### `detectPlatform(): Platform`

Identifies the host page from the URL.

### `getSelectedText(): string | null`

Safely retrieves text highlighted by the user within `contenteditable` divs, Shadow DOMs, or standard textareas.

### `replaceSelectedText(newText: string): boolean`

Safely overwrites the currently selected text and triggers React/Vue native `input` events so the host site's state management picks up the change.
