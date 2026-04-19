# Contributing to Prompt Tuner

Thanks for your interest in contributing. This document covers the basics.

## Getting Started

1. Fork and clone the repository
2. Follow [docs/SETUP.md](docs/SETUP.md) for environment setup (Node 18+, Chrome 138+, Gemini Nano)
3. Run `npm install` then `npm run dev` to start the Plasmo dev server
4. Load the extension from `build/chrome-mv3-dev/` in `chrome://extensions`

## Development Workflow

```bash
npm run dev        # Plasmo dev mode with hot-reload
npm run lint       # ESLint (must pass with 0 errors)
npm test           # Vitest unit tests
npm run test:e2e   # Playwright E2E tests (needs Chrome + extension loaded)
npm run build      # Production build with type checking
```

All PRs must pass lint, unit tests, and build before merge.

## Code Style

- TypeScript strict mode, no `any` without eslint-disable justification
- React function components with hooks
- CSS via Tailwind + `--pt-*` custom properties; avoid inline styles
- See [docs/STYLE.md](docs/STYLE.md) for full coding standards

## Architecture

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system overview and [CLAUDE.md](CLAUDE.md) for gotchas and key file locations. The `agentcontext/` directory has detailed build history and architectural decisions.

## Reporting Issues

Use GitHub Issues. Include:

- Chrome version and OS
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)

## Pull Requests

- Keep PRs focused - one feature or fix per PR
- Write descriptive commit messages
- Add tests for new functionality
- Update docs if you change user-facing behavior

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
