
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-20232A?logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwindcss&logoColor=white)
![Plasmo](https://img.shields.io/badge/Framework-Plasmo-000000?logo=plasmo&logoColor=white)
![Gemini Nano](https://img.shields.io/badge/AI-Gemini_Nano-4285F4)
![Playwright](https://img.shields.io/badge/Testing-Playwright-2EAD33?logo=playwright&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

Prompt Tuner is a lightweight, privacy-focused Chrome extension that acts as a "Grammarly for Prompts." It intercepts user input in browser-based LLM chats (like ChatGPT or Claude) and optimizes prompts using Google's built-in edge AI model (Gemini Nano). The system remains platform-agnostic by automatically scraping, distilling, and ingesting the latest prompt engineering documentation from major AI providers, ensuring the optimization logic stays current without manual code updates.

Unlike traditional prompt optimization tools that require manual updates or cloud-based processing, this system leverages local AI processing and automated knowledge distillation to achieve complete privacy, offline capability, and always-current optimization rules.

### Core Functionality

- **Platform-Agnostic Optimization:** Automatically detects the LLM platform (ChatGPT, Claude, etc.) and applies platform-specific optimization rules.
- **Edge AI Processing:** Uses Chrome's built-in Gemini Nano model to optimize prompts entirely on-device within the browser, ensuring zero data leaves your device.
- **Automated Knowledge Updates:** Quarterly GitHub Actions pipeline distills the latest prompt engineering documentation from major AI providers into compact "Golden Rules" that stay current without manual intervention.

---

## Impact & Performance

- **Privacy:** All processing happens locally in the browser using Gemini Nano—no data is sent to external servers.
- **Cost:** Completely free—leverages Chrome's built-in AI capabilities and free hosting via GitHub Pages.
- **Offline Capability:** Once rules are cached, the extension works offline for prompt optimization.

## Documentation

- **[SETUP.md](docs/SETUP.md):** Installation, environment configuration, and startup instructions.
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md):** System design, data flow, glossary, and design decisions.
- **[TESTING.md](docs/TESTING.md):** Testing guidelines.
- **[STYLE.md](docs/STYLE.md):** Coding standards, testing guidelines, and repository conventions.
- **[PRIVACY.md](docs/PRIVACY.md):** Privacy policy and data handling practices.

## License

See **[LICENSE](LICENSE)** file for details.
