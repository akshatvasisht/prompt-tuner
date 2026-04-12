# Changelog

All notable changes to Prompt Tuner will be documented in this file.

This project is pre-release. Version 0.1.0 is the initial development milestone targeting Chrome Web Store submission.

---

## [0.1.0] - Unreleased

Initial development release. Privacy-first Chrome extension that optimizes prompts for ChatGPT, Claude, and Gemini using Chrome's built-in Gemini Nano model.

### Core Features

- **Command Palette** (Cmd+Shift+K / Ctrl+Shift+K) with 6 prompt engineering actions:
  - Optimize (primary), Few-Shot, Chain of Thought, Assign a Role, Define Output, Add Constraints
- **Streaming UI** with real-time token display via long-lived Chrome ports
- **MiniPill Trigger** — floating sparkle button appears near selected text
- **Text Replacement** — Main World bridge for React-compatible textarea injection, Isolated World fallback
- **Platform Detection** — URL-based detection for ChatGPT, Claude, and Gemini with platform-specific optimization rules
- **Undo** — Sonner action toast with 8-second undo window after applying changes

### AI Engine

- Gemini Nano integration via Chrome Prompt API (`LanguageModel.create`)
- Session caching to avoid 2-3s cold-start latency on repeated optimizations
- Proactive session warming on textarea focus
- Smart lifecycle: 10-second grace period shutdown on tab hide, automatic re-warm on return
- RAF-based token batching to prevent per-token re-renders
- Dynamic token limit detection from session (`session.maxTokens` with 1800 fallback)
- Reader lock release on stream errors

### Rule System

- Hybrid rule loading: chrome.storage.local cache (7-day TTL) -> remote GitHub Pages fetch -> Zod-validated -> bundled fallback
- Per-platform rules for OpenAI, Anthropic, and Google
- Dynamic rule routing: filters rules by action-relevant tags (e.g., "few-shot" actions only see example/demonstration rules)
- Strict Zod schema validation rejects extra fields from remote sources
- Deduplicated concurrent fetches via in-flight promise map

### UI / UX

- "Klein Editorial" design system — ultramarine on cream paper, solid surfaces, ultramarine-tinted shadows, full radius and type scale tokenized under the `--pt-*` namespace
- Radix Dialog focus trapping with CSS view-transition–driven animations (`asChild` integration)
- Keyboard-driven: Enter to insert, Escape to close, Tab/Shift+Tab trapped within overlay
- Selection preview in streaming header with long-input warning
- Inline error panel with Try Again / Back to Actions
- ErrorBoundary wrappers on all entry points (overlay, popup, setup wizard)
- Accessible labels (`<Label htmlFor>`) on all popup form controls

### Setup Wizard

- 6-step onboarding: Welcome, Shortcut Discovery, Gemini Nano Setup, Action Explainer, Run on Open, Done
- Progress bar with animated step indicators
- Auto-opened on first install

### Extension Infrastructure

- Plasmo framework (MV3, content script + background service worker)
- Service worker keep-alive: alarm-based (active streaming) + PING interval (idle overlay), reference-counted for concurrent tabs
- 60-second streaming timeout prevents hung ports
- Port cleanup on overlay unmount and Cancel
- CSP restricts fetch origins to `*.github.io` and `*.githubusercontent.com`

### Developer Tooling

- 78 unit tests (Vitest, jsdom) with Chrome API and LanguageModel mocks
- E2E test suite (Playwright) for trigger injection, optimization flow, platform compatibility
- ESLint strict mode, Prettier formatting
- Pipeline scripts for rule scraping (Playwright) and distillation (Gemini Flash)

### Known Limitations

- Requires Chrome 138+ with Gemini Nano enabled
- `element-observer.ts` (CSS animation-based DOM detection) is built but not yet integrated — content script uses focusin listeners
- `replaceContentEditable` does not honour `beforeinput` cancellation (intentional — JSDOM inconsistency)
- Main World bridge has 1-second timeout; falls back to Isolated World on slow pages
