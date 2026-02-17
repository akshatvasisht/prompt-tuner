# Architecture Documentation

This document details the architectural decisions, system components, and data flow for Prompt Tuner.

---

## Glossary

- **Optimization Heuristics:** Platform-specific principles extracted from official documentation and stored as compact JSON files optimized for Gemini Nano's context window.
- **Scraping Pipeline:** An automated GitHub Actions workflow that fetches documentation via Playwright and Readability, distills it using Gemini Flash, and generates platform-specific rule files.
- **Trigger & Overlay:** A UI consisting of a floating trigger element and a centered glassmorphism overlay (CMD-K) for prompt optimization, built with Framer Motion and Shadcn/ui.

## System Overview

Prompt Tuner consists of a client-side Chrome extension and a background distillation pipeline. The extension automatically detects the LLM platform and applies relevant optimization rules. Prompt processing is executed locally using Chrome's built-in Gemini Nano model.

## Directory Structure

```
/root
├── pipeline/   # Tooling for rule distillation
├── rules/      # Rule files hosted on GitHub Pages
├── src/        # Extension source code
│   ├── contents/   # Browser-injected UI and scripts
│   ├── background/ # Service worker for AI processing
│   ├── components/ # React components
│   └── lib/        # Shared logic
├── tests/      # Unit and E2E tests
└── docs/       # Technical documentation
```

## Tech Stack

- **Framework:** Plasmo
- **UI:** Framer Motion, Shadcn/ui
- **AI:** Chrome Prompt API (Gemini Nano)
- **Scraping:** Playwright, Mozilla Readability
- **Distillation:** Gemini Flash
- **Hosting:** GitHub Pages

## Data Flow

### Rule Distillation Pipeline

1. Documentation is fetched via Playwright and Readability.
2. Gemini Flash distills content into rules.
3. JSON rule files are deployed to GitHub Pages.

### Extension Runtime

1. Extension detects the host platform.
2. Verifies `window.ai` availability.
3. Mounts trigger element and overlay.
4. Uses `chrome.runtime.Port` for background communication.
5. Processes prompt via `session.promptStreaming()`.
6. Streams tokens to overlay.
7. Updates host textarea via native property setters.

## Design Constraints

- **Context Limits:** Distilled rules are used due to Gemini Nano context window constraints.
- **Style Isolation:** Shadow DOM prevents host site CSS interference.
- **Local Processing:** AI processing is restricted to on-device models.
