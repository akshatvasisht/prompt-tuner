# Prompt Tuner

## Overview

**Prompt Tuner** is a lightweight, privacy-focused Chrome extension that acts as a "Grammarly for Prompts." It intercepts user input in browser-based LLM chats (like ChatGPT or Claude) and optimizes prompts using Google's built-in local AI model (Gemini Nano). The system remains platform-agnostic by automatically scraping, distilling, and ingesting the latest prompt engineering documentation from major AI providers, ensuring the optimization logic stays current without manual code updates.

Unlike traditional prompt optimization tools that require manual updates or cloud-based processing, this system leverages local AI processing and automated knowledge distillation to achieve complete privacy, offline capability, and always-current optimization rules.

### Core Functionality
* **Platform-Agnostic Optimization:** Automatically detects the LLM platform (ChatGPT, Claude, etc.) and applies platform-specific optimization rules.
* **Local AI Processing:** Uses Chrome's built-in Gemini Nano model to optimize prompts entirely within the browser, ensuring zero data leaves your device.
* **Automated Knowledge Updates:** Quarterly GitHub Actions pipeline distills the latest prompt engineering documentation from major AI providers into compact "Golden Rules" that stay current without manual intervention.

---

## Impact & Performance

* **Privacy:** All processing happens locally in the browser using Gemini Nano—no data is sent to external servers.
* **Cost:** Completely free—leverages Chrome's built-in AI capabilities and free hosting via GitHub Pages.
* **Offline Capability:** Once rules are cached, the extension works offline for prompt optimization.

## Documentation

* **[SETUP.md](SETUP.md):** Installation, environment configuration, and startup instructions.
* **[ARCHITECTURE.md](docs/ARCHITECTURE.md):** System design, data flow, glossary, and design decisions.
* **[API.md](docs/API.md):** [Protocols / API / Interface] reference.
* **[TESTING.md](docs/TESTING.md):** Testing guidelines.
* **[STYLE.md](docs/STYLE.md):** Coding standards, testing guidelines, and repository conventions.

## License

See **[LICENSE](LICENSE)** file for details.
