# Architecture Documentation

This document details the architectural decisions, system components, and data flow for Prompt Tuner.

---

## Glossary
* **Golden Rules:** Platform-specific, distilled prompt engineering principles extracted from official documentation and stored as compact JSON files optimized for Gemini Nano's context window.
* **Scraping Pipeline:** The automated GitHub Actions workflow that fetches documentation via Playwright + Readability, distills it using Gemini Flash, and generates platform-specific rule files.
* **Sparkle Widget:** The floating UI component that appears adjacent to active text inputs, similar to Grammarly's interface, built using Radix UI and Floating UI.

## System Overview
Prompt Tuner is a Chrome extension built with a two-part architecture: (1) a client-side extension that runs in the browser and (2) a background knowledge distillation pipeline that runs quarterly via GitHub Actions. The extension uses a platform-agnostic approach, automatically detecting the LLM platform and applying appropriate optimization rules. All prompt processing happens locally using Chrome's built-in Gemini Nano model, ensuring complete privacy and offline capability.

## Directory Structure
```
/root
├── extension/          # Plasmo-based Chrome extension code
├── pipeline/           # GitHub Actions scripts for knowledge distillation
├── rules/              # Platform-specific JSON rule files (hosted on GitHub Pages)
└── docs/               # Documentation
```

## Tech Stack & Decision Record

| Category | Technology | Rationale |
| :--- | :--- | :--- |
| **Extension Framework** | Plasmo | Removes boilerplate and complexity of raw Chrome extension development, provides React/TypeScript framework with hot-reload |
| **UI Positioning** | Floating UI / Radix UI | Handles complex logic of positioning elements near dynamic cursors or text inputs without manual CSS/Shadow DOM positioning |
| **Local AI Engine** | Chrome Prompt API (Gemini Nano) | Provides free, fast, and offline LLM directly inside the browser, ensuring privacy |
| **Documentation Scraping** | Playwright + Mozilla Readability | Self-hosted solution with JS rendering capability and battle-tested content extraction |
| **Knowledge Distillation** | Gemini Flash | Processes raw documentation text to extract top-tier prompting principles within reasonable token limits |
| **Rule Hosting** | GitHub Pages | Free, high-availability "backend" for hosting platform-specific rules files |
| **Automation** | GitHub Actions | Runs quarterly scripts to keep rules current with infrequent model update schedules |

## Data Flow

### Knowledge Distillation Pipeline (Quarterly)
1. **Input:** Documentation URLs from major AI providers (OpenAI, Anthropic, etc.)
2. **Scraping:** Playwright renders pages, Readability extracts content, Turndown converts to Markdown
3. **Distillation:** Gemini Flash extracts top-tier prompting principles from the raw text
4. **Output:** Platform-specific JSON files (e.g., `openai.json`, `anthropic.json`) saved to repository and hosted on GitHub Pages

### Extension Runtime Flow
1. **Initialization:** Extension checks `window.location.hostname` to detect platform:
   - If hostname includes `chatgpt.com`, it loads `openai.json`
   - If hostname includes `claude.ai`, it loads `anthropic.json`
2. **Compliance Check:** Verifies `window.ai` availability. If Gemini Nano is not active, the extension guides users to enable the required feature via `chrome://flags`
3. **User Input:** User types a draft prompt in the LLM chat interface
4. **UI Trigger:** Floating "Sparkle" widget appears adjacent to active cursor/input
5. **Local Optimization:** Extension sends draft + platform-specific Golden Rules to Gemini Nano
6. **Output Generation:** Gemini Nano rewrites the prompt using platform-optimized logic
7. **React Injection:** Custom Event Dispatcher updates the text and fires input/change events (with `bubbles: true`) to ensure host site (React/Vue) recognizes the state change

## Design Constraints & Trade-offs
* **Context Window Limits:** Raw documentation is too large for Gemini Nano's context window (~4k tokens). We prioritized compact, distilled "Golden Rules" over comprehensive documentation to ensure the optimization engine can process everything locally.
* **Update Frequency:** The knowledge distillation pipeline runs quarterly, following the infrequent release schedule of model updates. We prioritized automation and cost-effectiveness over real-time updates.
* **Platform-Specific Rules:** We maintain separate JSON files per platform (e.g., `openai.json`, `anthropic.json`) to accommodate specific model quirks like XML tags vs. Markdown headers, prioritizing accuracy over code simplicity.
* **Privacy vs. Performance:** All processing happens locally using Gemini Nano, which may be slower than cloud-based alternatives but ensures complete privacy and offline capability.
