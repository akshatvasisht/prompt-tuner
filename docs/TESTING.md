# Testing Guide

This document describes the testing strategy, frameworks, and practices for the Prompt Tuner Chrome extension.

---

## Frameworks

- **Unit:** Vitest (jsdom)
- **E2E:** Playwright (Chromium)

## Running Tests

```bash
npm test                # Unit tests
npm run test:e2e        # E2E tests
```

## Coverage

- **ai-engine:** Gemini Nano API integration.
- **platform-rules:** Rule loading and validation.
- **platform-detector:** URL-based detection.
- **dom-injector:** Text replacement logic.
- **UI:** Shadow DOM and streaming verification.

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
