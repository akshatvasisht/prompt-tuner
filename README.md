
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-20232A?logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwindcss&logoColor=white)
![Plasmo](https://img.shields.io/badge/Framework-Plasmo-000000?logo=plasmo&logoColor=white)
![Gemini Nano](https://img.shields.io/badge/AI-Gemini_Nano-4285F4)
![Playwright](https://img.shields.io/badge/Testing-Playwright-2EAD33?logo=playwright&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

Prompt Tuner is a Chrome extension for prompt optimization on sites like ChatGPT and Claude. It uses on-device AI (Gemini Nano) to optimize input prompts locally.

### Features

- **Automated Detection:** Identifies the LLM platform and applies relevant optimization rules.
- **Local AI Processing:** Uses Chrome's built-in Gemini Nano for optimization. All data stays in the browser.
- **Streaming UI:** Tokens are streamed into a glassmorphism overlay.
- **Rule Lifecycle:** A GitHub Actions pipeline updates platform rules quarterly.

### Technical Implementation

- **Isolation:** UI components are injected via Shadow DOM to prevent host style conflicts.
- **Data Flow:** Uses `chrome.runtime.Port` for token streaming between content scripts and background workers.
- **Validation:** Platform rules are validated at runtime via Zod schemas.

## Documentation

- **[SETUP.md](docs/SETUP.md):** Environment configuration and startup.
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md):** System design and data flow.
- **[TESTING.md](docs/TESTING.md):** Testing guide.
- **[STYLE.md](docs/STYLE.md):** Developer conventions.
- **[PRIVACY.md](docs/PRIVACY.md):** Privacy policy.

## License

MIT
