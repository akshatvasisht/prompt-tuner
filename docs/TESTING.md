# Testing Guide

This document describes the testing strategy, frameworks, and practices for the Prompt Tuner Chrome extension.

---

## Overview

Prompt Tuner uses a comprehensive testing strategy combining:

- **Unit Tests**: Vitest with jsdom for component and library testing
- **End-to-End Tests**: Playwright for browser automation and integration testing
- **Type Checking**: TypeScript strict mode for compile-time safety

---

## Test Frameworks

### Unit Testing: Vitest

**Version**: 2.1.8  
**Environment**: jsdom  
**Configuration**: `vitest.config.ts`

Vitest provides fast, modern unit testing with native TypeScript support and excellent developer experience.

### E2E Testing: Playwright

**Version**: 1.48.0  
**Browser**: Chromium  
**Configuration**: `playwright.config.ts`

Playwright enables reliable end-to-end testing with full browser automation capabilities.

---

## Running Tests

### Unit Tests

Run the full unit test suite:

```bash
npm test
```

Run tests in watch mode (for development):

```bash
npm test -- --watch
```

Run tests with interactive UI:

```bash
npm run test:ui
```

Run with coverage report:

```bash
npm test -- --coverage
```

### End-to-End Tests

**Prerequisites**: E2E tests require Chromium browser and system dependencies:

```bash
# Step 1: Install system dependencies (requires sudo)
sudo bash scripts/install-test-deps.sh

# Step 2: Install Chromium browser for Playwright
npx playwright install chromium
```

**Note**: On WSL or systems without sudo access, you may need to manually install the required packages:
- libnss3, libnspr4, libatk1.0-0, libatk-bridge2.0-0, libcups2, libdrm2, libdbus-1-3
- libxkbcommon0, libxcomposite1, libxdamage1, libxfixes3, libxrandr2
- libgbm1, libpango-1.0-0, libcairo2, libasound2

Run the E2E test suite:

```bash
npm run test:e2e
```

Run E2E tests with headed browser (visible):

```bash
npm run test:e2e:headed
```

Run E2E tests in debug mode:

```bash
npm run test:e2e:debug
```

Run specific E2E test file:

```bash
npm run test:e2e -- tests/e2e/trigger-injection.spec.ts
```

**Note**: The `pretest:e2e` script automatically builds the extension before running tests.

---

## Test Structure

### Directory Layout

```
tests/
  setup.ts              # Global test setup and mocks
  unit/
    ai-engine.test.ts          # AI engine tests
    platform-rules.test.ts     # Rule loading and validation tests
    platform-detector.test.ts  # Platform detection tests
    dom-injector.test.ts       # DOM manipulation tests
    sparkle-widget.test.tsx    # React component tests
  e2e/
    trigger-injection.spec.ts  # Trigger button injection tests
    optimization-flow.spec.ts  # Full optimization flow tests
    platform-compat.spec.ts    # Cross-platform compatibility tests
```

---

## Unit Test Suites

### ai-engine.test.ts

Tests the AI engine module that interfaces with Chrome's Gemini Nano API.

**Coverage**:

- `checkAIAvailability()` - Verifies AI availability detection
- `optimizePrompt()` - Tests prompt optimization flow
- Error handling for unavailable AI states
- Session management and cleanup

**Key Test Cases**:

- Returns available when AI is ready
- Returns unavailable when LanguageModel API is not defined
- Handles downloadable state correctly
- Handles downloading state correctly
- Throws PromptTunerError on optimization failure

### platform-rules.test.ts

Tests the rule loading system with hybrid remote/bundled architecture.

**Coverage**:

- `getRulesForPlatform()` - Platform-specific rule retrieval
- `loadBundledRules()` - Bundled rule loading
- Zod schema validation
- Cache management
- Fallback behavior on fetch failure

**Key Test Cases**:

- Returns bundled rules when fetch fails
- Validates rules against Zod schema
- Caches rules for configured duration
- Falls back to bundled rules on validation failure
- Handles network timeouts gracefully

### platform-detector.test.ts

Tests the platform detection logic for LLM chat interfaces.

**Coverage**:

- `detectPlatform()` - URL-based platform detection
- `getPlatformSelectors()` - Platform-specific DOM selectors
- Edge cases for alternate domains

**Key Test Cases**:

- Detects ChatGPT on chat.openai.com
- Detects ChatGPT on chatgpt.com (alternate domain)
- Detects Claude on claude.ai
- Detects Gemini on gemini.google.com
- Detects Gemini on bard.google.com (legacy domain)
- Returns unknown for unsupported domains

### dom-injector.test.ts

Tests DOM manipulation utilities for text replacement.

**Coverage**:

- `replaceTextInElement()` - Safe text replacement
- `replaceTextViaMainWorld()` - Main World bridge communication
- Input element handling
- ContentEditable handling

**Key Test Cases**:

- Replaces text in textarea elements
- Replaces text in contenteditable elements
- Handles React-controlled inputs via Main World
- Validates message origin correctly
- Times out gracefully on no response

### sparkle-widget.test.tsx

Tests the React UI component for the optimization widget.

**Coverage**:

- Component rendering
- User interactions (click, hover)
- State management
- Streaming text display
- Error states

**Key Test Cases**:

- Renders widget icon correctly
- Shows optimization panel on click
- Displays streaming tokens during optimization
- Shows error message on failure
- Hides panel when clicking outside

---

## E2E Test Suites

### trigger-injection.spec.ts

Tests trigger button injection on supported LLM platforms.

**Coverage**:

- Trigger button appears on ChatGPT
- Trigger button appears on Claude
- Trigger button appears on Gemini
- Trigger button positioning on right edge
- Shadow DOM isolation
- Neobrutalist visual design (construction yellow, black borders, brutal shadows)

### optimization-flow.spec.ts

Tests the complete prompt optimization workflow using the side panel.

**Coverage**:

- User clicks trigger button
- Side panel opens with original text
- User clicks optimize button
- Streaming response displays correctly in panel
- User can edit optimized text before accepting
- Accept button injects text back to platform
- Cancel button closes panel without injection

### platform-compat.spec.ts

Tests cross-platform compatibility.

**Coverage**:

- Platform-specific selectors work correctly
- Different textarea implementations handled
- No console errors on any platform
- Extension doesn't break page functionality

---

## Mocking Strategy

### Chrome API Mocks

The test setup (`tests/setup.ts`) provides comprehensive mocks for Chrome Extension APIs:

```typescript
const mockChrome = {
  runtime: {
    id: "test-extension-id",
    getManifest: vi.fn(() => ({ version: "0.1.0" })),
    onInstalled: { addListener: vi.fn() },
    onStartup: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    onAlarm: { addListener: vi.fn() },
  },
};
```

### LanguageModel API Mocks

Chrome's Gemini Nano API is mocked for testing:

```typescript
const mockLanguageModel = {
  availability: vi.fn(() => Promise.resolve("available")),
  params: vi.fn(() =>
    Promise.resolve({
      defaultTopK: 40,
      maxTopK: 128,
      defaultTemperature: 0.7,
      maxTemperature: 2.0,
    }),
  ),
  create: vi.fn(() => Promise.resolve(createMockSession())),
};
```

### Test Utilities

**`createMockLanguageModel(overrides)`**: Creates a custom LanguageModel mock with specified behavior.

**`resetLanguageModelMock()`**: Resets the LanguageModel mock to default state between tests.

---

## Coverage Requirements

### Minimum Coverage Targets

| Metric     | Target |
| ---------- | ------ |
| Statements | 80%    |
| Branches   | 75%    |
| Functions  | 80%    |
| Lines      | 80%    |

### Coverage Report

Generate coverage report:

```bash
npm test -- --coverage
```

Coverage output formats:

- **text**: Console output
- **json**: `coverage/coverage-final.json`
- **html**: `coverage/index.html`

---

## Writing Tests

### Unit Test Guidelines

1. **Isolation**: Each test should be independent and not rely on shared state
2. **Descriptive Names**: Use clear, descriptive test names that explain the expected behavior
3. **Arrange-Act-Assert**: Follow the AAA pattern for test structure
4. **Mock External Dependencies**: Always mock Chrome APIs and network requests

**Example**:

```typescript
describe("checkAIAvailability", () => {
  it("should return available when AI is ready", async () => {
    // Arrange
    resetLanguageModelMock();

    // Act
    const result = await checkAIAvailability();

    // Assert
    expect(result.available).toBe(true);
  });
});
```

### E2E Test Guidelines

1. **Stable Selectors**: Use data-testid attributes where possible
2. **Wait for Elements**: Always wait for elements to be visible before interacting
3. **Clean State**: Each test should start with a clean browser state
4. **Network Handling**: Mock or intercept network requests when appropriate

**Example**:

```typescript
test("trigger button appears on ChatGPT", async ({ page }) => {
  await page.goto("https://chat.openai.com");
  await page.waitForSelector("[data-testid='trigger-button']");

  const trigger = page.locator("[data-testid='trigger-button']");
  await expect(trigger).toBeVisible();
});
```

---

## Continuous Integration

### Pre-commit Hooks

Husky runs linting and formatting checks before each commit:

```bash
npm run lint
npm run format:check
```

### CI Pipeline

The CI pipeline runs:

1. `npm run lint` - ESLint checks
2. `npm run format:check` - Prettier formatting
3. `npm test` - Unit tests with coverage
4. `npm run test:e2e` - E2E tests
5. `npm run build` - Production build verification

---

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "LanguageModel is not defined"  
**Solution**: Ensure `tests/setup.ts` is loaded via `setupFiles` in Vitest config

**Issue**: E2E tests timeout on trigger button detection  
**Solution**: Increase timeout or ensure extension is properly loaded in browser context

**Issue**: Mock functions not being called  
**Solution**: Verify mock is stubbed before the code under test runs; use `beforeEach` for reset

**Issue**: Coverage not meeting targets  
**Solution**: Add tests for uncovered branches; focus on error handling paths

### Debug Mode

Run unit tests with verbose output:

```bash
npm test -- --reporter=verbose
```

Run E2E tests with debug logging:

```bash
DEBUG=pw:api npm run test:e2e
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Chrome Extension Testing](https://developer.chrome.com/docs/extensions/mv3/tut_debugging/)

---

**Document Version**: 1.0  
**Last Updated**: January 27, 2026
