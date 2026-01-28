# Coding Standards & Style Guide

This document defines the coding standards, conventions, and best practices for the Prompt Tuner Chrome extension. All contributors must follow these guidelines to ensure code quality, maintainability, and consistency.

---

## Table of Contents

1. [General Principles](#general-principles)
2. [TypeScript Guidelines](#typescript-guidelines)
3. [React & Component Patterns](#react--component-patterns)
4. [CSS & Styling](#css--styling)
5. [Testing Standards](#testing-standards)
6. [Chrome Extension Security](#chrome-extension-security)
7. [Performance Guidelines](#performance-guidelines)
8. [Documentation Standards](#documentation-standards)
9. [Git Workflow](#git-workflow)
10. [Code Review Checklist](#code-review-checklist)

---

## General Principles

### Code Quality Philosophy

- **Readability over cleverness** — Code is read far more often than it is written. Prioritize clarity.
- **Intent over implementation** — Comments should explain _why_, not _what_. Let the code speak for itself.
- **Fail fast, fail loud** — Errors should surface immediately with clear messages.
- **Single responsibility** — Functions and components should do one thing well.
- **Defensive coding** — Validate inputs, handle edge cases, never trust external data.

### Professionalism

- Documentation and comments must be objective and professional. Avoid slang, humor, or colloquialisms.
- Use inclusive language. Avoid terms like "whitelist/blacklist" (use "allowlist/blocklist").
- Error messages should be actionable and user-friendly.

---

## TypeScript Guidelines

### Strict Mode Required

All TypeScript code must pass strict mode compilation. The following compiler options are mandatory:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true
}
```

### Naming Conventions

| Element            | Convention               | Example                              |
| ------------------ | ------------------------ | ------------------------------------ |
| Variables          | camelCase                | `userInput`, `isProcessing`          |
| Functions          | camelCase                | `optimizePrompt()`, `handleClick()`  |
| Constants          | SCREAMING_SNAKE_CASE     | `MAX_RETRIES`, `DEFAULT_TIMEOUT`     |
| Types/Interfaces   | PascalCase               | `OptimizeRequest`, `AIAvailability`  |
| Enums              | PascalCase               | `ErrorCode`, `WidgetStatus`          |
| Components         | PascalCase               | `SparkleWidget`, `PromptInput`       |
| Files (components) | kebab-case               | `sparkle-widget.tsx`, `ai-engine.ts` |
| Test files         | Same as source + `.test` | `ai-engine.test.ts`                  |

### Type Definitions

```typescript
// Prefer interfaces for object shapes
interface OptimizeRequest {
  draft: string;
  platform: Platform;
  context?: string;
}

// Use type for unions, intersections, and aliases
type Platform = "openai" | "anthropic" | "google" | "unknown";
type SupportedPlatform = Exclude<Platform, "unknown">;

// Use type-only imports when importing types
import { type OptimizeRequest, PromptTunerError } from "~types";
```

### Type Safety Rules

1. **Never use `any`** — Use `unknown` and narrow with type guards if needed.
2. **Avoid type assertions** — Prefer type guards or generics over `as` casts.
3. **Explicit return types** — Public functions must have explicit return type annotations.
4. **Null checks** — Use optional chaining (`?.`) and nullish coalescing (`??`) appropriately.
5. **Index signatures** — Always handle potentially undefined values from index access.

```typescript
// Bad: Unsafe index access
const value = items[index];
value.doSomething();

// Good: Safe index access
const value = items[index];
if (value !== undefined) {
  value.doSomething();
}
```

### Async/Await

- **Prefer `async/await`** over raw Promises or callbacks.
- **Always handle errors** in async functions with try/catch.
- **Use `Promise.all()`** for concurrent operations when appropriate.
- **Never ignore Promise rejections** — Handle or explicitly void them.

```typescript
// ✅ Good: Proper async error handling
export async function optimizePrompt(draft: string): Promise<string> {
  try {
    const session = await createSession();
    return await session.prompt(draft);
  } catch (error) {
    throw new PromptTunerError(
      error instanceof Error ? error.message : "Unknown error",
      "AI_GENERATION_FAILED",
    );
  } finally {
    session?.destroy();
  }
}
```

### Error Handling

Use the custom `PromptTunerError` class for all extension errors:

```typescript
export class PromptTunerError extends Error {
  code: ErrorCode;

  constructor(message: string, code: ErrorCode) {
    super(message);
    this.name = "PromptTunerError";
    this.code = code;
  }
}

// Error codes must be specific and actionable
type ErrorCode =
  | "AI_UNAVAILABLE"
  | "AI_SESSION_FAILED"
  | "AI_GENERATION_FAILED"
  | "INVALID_REQUEST"
  | "ELEMENT_NOT_FOUND"
  | "PLATFORM_UNSUPPORTED"
  | "DATABASE_ERROR"
  | "UNKNOWN_ERROR";
```

---

## React & Component Patterns

### Component Structure

Components should follow this structure:

```typescript
/**
 * Component description (JSDoc)
 */

import * as React from "react"
import { useEffect, useState, useCallback } from "react"
// External imports

import { someUtil } from "~lib/utils"
// Internal imports (use path aliases)

import "../styles/component.css"
// Style imports last

// =============================================================================
// Types
// =============================================================================

interface ComponentProps {
  // Props interface
}

type ComponentState = "idle" | "loading" | "success" | "error"

// =============================================================================
// Component
// =============================================================================

export const MyComponent: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Hooks
  const [state, setState] = useState<ComponentState>("idle")

  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies])

  // Callbacks
  const handleClick = useCallback(() => {
    // Handler logic
  }, [dependencies])

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}

export const MemoizedComponent = React.memo(MyComponent)
```

### Plasmo Content Script UI (CSUI) Patterns

For Chrome extension content scripts, follow Plasmo CSUI patterns:

```typescript
import type { PlasmoCSConfig, PlasmoGetOverlayAnchor } from "plasmo"

// Configuration
export const config: PlasmoCSConfig = {
  matches: ["https://example.com/*"],
}

// Overlay anchor for automatic mounting/unmounting
export const getOverlayAnchor: PlasmoGetOverlayAnchor = async () => {
  return document.querySelector("textarea[data-id='root']")
}

// Component automatically manages lifecycle
export default function ContentScript() {
  return <div>Content</div>
}
```

### Hook Rules

1. **Follow Rules of Hooks** — Only call hooks at the top level of components.
2. **Use `useCallback`** for functions passed to child components.
3. **Use `useMemo`** for expensive computations.
4. **Use `useRef`** for mutable values that shouldn't trigger re-renders.
5. **Custom hooks** must start with `use` prefix.

```typescript
// Good: Proper hook usage
const handleClick = useCallback(async (): Promise<void> => {
  if (isProcessingRef.current) return;
  // ... processing logic
}, [dependencies]);

const combinedStyles = useMemo(
  () => ({
    ...floatingStyles,
    zIndex: 2147483647,
  }),
  [floatingStyles],
);
```

### Accessibility

All components must be accessible:

1. **Use semantic HTML** — `<button>`, `<nav>`, `<main>`, etc.
2. **ARIA labels** — Provide `aria-label` for icon-only buttons.
3. **ARIA states** — Use `aria-busy`, `aria-disabled`, `aria-expanded`.
4. **Keyboard support** — All interactive elements must be keyboard accessible.
5. **Focus management** — Visible focus indicators, logical focus order.

```tsx
<button
  onClick={() => void handleClick()}
  disabled={status === "processing"}
  aria-label={status === "processing" ? "Processing..." : "Optimize prompt"}
  aria-busy={status === "processing"}
  type="button"
>
  <Sparkles className="icon" />
</button>
```

### Event Handler Naming

| Event Type        | Handler Prefix | Example                             |
| ----------------- | -------------- | ----------------------------------- |
| Click             | `handle`       | `handleClick`, `handleSubmit`       |
| Change            | `handle`       | `handleChange`, `handleInputChange` |
| Callbacks (props) | `on`           | `onProcessingComplete`, `onChange`  |

---

## CSS & Styling

### Tailwind CSS

- Use Tailwind utility classes as the primary styling method.
- Custom CSS should only be used for complex animations or component-specific styles.
- Use `@layer` directives for custom CSS to maintain proper cascade order.

### Design Tokens

Use CSS custom properties for theme values:

```css
:root {
  --primary: 262 83% 58%;
  --primary-foreground: 210 40% 98%;
  --destructive: 0 84.2% 60.2%;
  --radius: 0.5rem;
}
```

### Component Classes

Use `@apply` for reusable component styles:

```css
@layer components {
  .sparkle-button {
    @apply flex items-center justify-center;
    @apply min-w-[40px] min-h-[40px] p-2.5;
    @apply bg-primary text-primary-foreground;
    @apply rounded-full shadow-lg;
    @apply transition-all duration-200 ease-out;
    @apply hover:shadow-xl hover:scale-105;
    @apply focus:outline-none focus:ring-2 focus:ring-ring;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }
}
```

### Class Name Utilities

Use the `cn()` utility for conditional class names:

```tsx
import { cn } from "~lib/utils"

<button
  className={cn(
    "sparkle-button",
    status === "processing" && "animate-pulse",
    isLarge && "min-w-[56px] min-h-[56px]"
  )}
>
```

---

## Testing Standards

### Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { functionUnderTest } from "~lib/module";

describe("module-name", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("functionUnderTest", () => {
    it("should return expected result when given valid input", async () => {
      // Arrange
      const input = "test";

      // Act
      const result = await functionUnderTest(input);

      // Assert
      expect(result).toBe("expected");
    });

    it("should throw error when given invalid input", async () => {
      await expect(functionUnderTest(null)).rejects.toThrow(ExpectedError);
    });
  });
});
```

### Test Naming

- Use descriptive names that explain the expected behavior.
- Format: `should [expected behavior] when [condition]`
- Group related tests with nested `describe` blocks.

### Coverage Requirements

| Metric     | Minimum |
| ---------- | ------- |
| Statements | 80%     |
| Branches   | 75%     |
| Functions  | 80%     |
| Lines      | 80%     |

### What to Test

- **Unit tests**: Pure functions, utilities, business logic.
- **Component tests**: User interactions, state changes, accessibility.
- **Integration tests**: Message passing, storage operations.
- **E2E tests**: Critical user flows, cross-component interactions.

### What NOT to Test

- Third-party library internals.
- Framework boilerplate.
- TypeScript type checking (the compiler handles this).

---

## Chrome Extension Security

### Content Security Policy

- Never use inline scripts or `eval()`.
- Never use `innerHTML` with untrusted content.
- All external resources must be explicitly allowed.

### Message Passing

- Validate all incoming messages from content scripts.
- Use typed message interfaces for type safety.
- Never execute arbitrary code from messages.

```typescript
// ✅ Good: Validated message handling
export interface OptimizeRequest {
  draft: string;
  platform: Platform;
}

const handler: PlasmoMessaging.MessageHandler<
  OptimizeRequest,
  OptimizeResponse
> = async (req, res) => {
  if (!req.body?.draft || typeof req.body.draft !== "string") {
    res.send({
      success: false,
      error: { code: "INVALID_REQUEST", message: "Invalid draft" },
    });
    return;
  }
  // Process validated input
};
```

### Port-Based Messaging for Streaming

For streaming data or maintaining long-lived connections, use `chrome.runtime.Port`:

```typescript
// Content script - open port
const port = chrome.runtime.connect({ name: "optimize-port" });

port.onMessage.addListener((message) => {
  if (message.type === "CHUNK") {
    // Handle streaming chunk
  }
});

port.postMessage({ type: "START_OPTIMIZATION", draft: "text" });

// Background - handle port connections
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "optimize-port") return;

  port.onMessage.addListener((message) => {
    // Validate and process
    port.postMessage({ type: "CHUNK", data: "..." });
  });
});
```

### Main World Injection

For bypassing React/Vue Virtual DOM restrictions, use Main World injection:

```typescript
// In content script config
export const config: PlasmoCSConfig = {
  matches: ["https://example.com/*"],
  world: "MAIN",
};

// Communicate via window.postMessage
window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;
  // Process message
});
```

### Runtime Validation with Zod

All external data (fetched rules, user input, storage) must be validated at runtime:

```typescript
import { z } from "zod";

const RuleSchema = z.object({
  id: z.string(),
  platform: z.enum(["openai", "anthropic", "google"]),
  rule: z.string(),
  tags: z.array(z.string()),
});

const RulesArraySchema = z.array(RuleSchema);

// Validate before use
const result = RulesArraySchema.safeParse(jsonData);
if (!result.success) {
  // Fall back to bundled rules
  return BUNDLED_RULES;
}
```

### Data Handling

- **Never store sensitive data** in `chrome.storage.local` unencrypted.
- **Minimize permissions** — Only request necessary permissions.
- **Validate all user input** before processing.
- **Sanitize data** before DOM insertion.

### Extension Context

Always check for valid extension context before Chrome API calls:

```typescript
const isExtensionContextValid = (): boolean => {
  try {
    return (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      typeof chrome.runtime.id !== "undefined"
    );
  } catch {
    return false;
  }
};
```

---

## Performance Guidelines

### React Performance

1. **Memoize expensive computations** with `useMemo`.
2. **Memoize callbacks** with `useCallback` to prevent unnecessary re-renders.
3. **Use `React.memo`** for components with stable props.
4. **Avoid inline object/array literals** in JSX props.
5. **Lazy load** non-critical components.

### Resource Management

1. **Clean up effects** — Return cleanup functions from `useEffect`.
2. **Abort pending requests** — Use `AbortController` for cancellable operations.
3. **Destroy AI sessions** — Always call `session.destroy()` in finally blocks.

```typescript
useEffect(() => {
  const abortController = new AbortController();

  fetchData(abortController.signal);

  return () => {
    abortController.abort();
  };
}, []);
```

### Session Caching

Cache expensive resources to reduce latency:

```typescript
// Global cache for reusable sessions
let cachedSession: LanguageModel | null = null;
let cachedSystemPrompt: string | null = null;

async function getOrCreateSession(
  systemPrompt: string,
): Promise<LanguageModel> {
  // Reuse if system prompt matches
  if (cachedSession && cachedSystemPrompt === systemPrompt) {
    return cachedSession;
  }

  // Clear old session
  if (cachedSession) {
    cachedSession.destroy();
  }

  // Create and cache new session
  cachedSession = await LanguageModel.create({
    initialPrompts: [{ role: "system", content: systemPrompt }],
  });
  cachedSystemPrompt = systemPrompt;

  return cachedSession;
}

// Clear cache on rule changes
export function clearSessionCache(): void {
  if (cachedSession) {
    cachedSession.destroy();
    cachedSession = null;
    cachedSystemPrompt = null;
  }
}
```

### Streaming Implementation

Implement streaming for better UX on long-running operations:

```typescript
// Streaming with callback for progress updates
async function optimizePromptStreaming(
  draft: string,
  onChunk: (chunk: string) => void,
): Promise<string> {
  const stream = session.promptStreaming(draft);
  const reader = stream.getReader();
  let result = "";

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    result += value;
    onChunk(value); // Update UI incrementally
  }

  return result;
}
```

### Bundle Size

- Use tree-shakeable imports (`import { specific } from "library"`).
- Avoid large dependencies for simple functionality.
- Analyze bundle size regularly with build tools.

---

## Documentation Standards

### JSDoc Comments

All public functions must have JSDoc comments:

````typescript
/**
 * Optimizes a prompt using Gemini Nano with the given rules
 *
 * @param draft - The original prompt to optimize
 * @param rules - Array of optimization rules to apply
 * @param options - Optional configuration for the AI
 * @returns The optimized prompt
 * @throws {PromptTunerError} When AI is unavailable or generation fails
 *
 * @example
 * ```typescript
 * const optimized = await optimizePrompt("Hello", ["Be specific"])
 * ```
 */
export async function optimizePrompt(
  draft: string,
  rules: string[],
  options?: AIOptimizeOptions,
): Promise<string>;
````

### Section Separators

Use section separators to organize code:

```typescript
// =============================================================================
// Constants
// =============================================================================

const MAX_RETRIES = 3;

// =============================================================================
// Helper Functions
// =============================================================================

function helper() {}

// =============================================================================
// Public API
// =============================================================================

export function publicFunction() {}
```

### README and Markdown

- Use clear, hierarchical headings.
- Include code examples with syntax highlighting.
- Keep documentation up-to-date with code changes.
- Use tables for structured information.

---

## Git Workflow

### Branch Naming

| Type     | Pattern                | Example                          |
| -------- | ---------------------- | -------------------------------- |
| Feature  | `feature/description`  | `feature/streaming-optimization` |
| Bug fix  | `fix/description`      | `fix/widget-positioning`         |
| Hotfix   | `hotfix/description`   | `hotfix/security-patch`          |
| Refactor | `refactor/description` | `refactor/ai-engine-cleanup`     |
| Docs     | `docs/description`     | `docs/api-documentation`         |

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation only
- `style` — Formatting, no code change
- `refactor` — Code change that neither fixes bug nor adds feature
- `test` — Adding or updating tests
- `chore` — Build process, dependencies, tooling

**Examples:**

```
feat(ai-engine): add streaming optimization support

fix(widget): correct positioning near viewport edge

refactor(types): consolidate error code definitions
```

### Commit Guidelines

- Use imperative mood: "Add feature" not "Added feature" or "Adds feature"
- Keep subject line under 72 characters
- Reference issues in the body when applicable
- One logical change per commit

### Pre-commit Hooks

The following checks run automatically via Husky:

1. **ESLint** — TypeScript linting with strict rules
2. **Prettier** — Code formatting
3. **Type checking** — TypeScript compilation

---

## Code Review Checklist

### Before Requesting Review

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Linter passes with no warnings
- [ ] Self-reviewed the diff
- [ ] Updated relevant documentation
- [ ] Added tests for new functionality
- [ ] Removed debugging code and console logs

### Reviewer Checklist

- [ ] Code follows style guide conventions
- [ ] Logic is correct and handles edge cases
- [ ] Error handling is appropriate
- [ ] No security vulnerabilities introduced
- [ ] Performance implications considered
- [ ] Accessibility requirements met
- [ ] Tests are meaningful and comprehensive
- [ ] Documentation is accurate and complete

---

## Tool Configuration Reference

### ESLint

Key rules enforced:

- `@typescript-eslint/strict-type-checked`
- `@typescript-eslint/consistent-type-imports`
- `react-hooks/rules-of-hooks`
- `no-console` (warn, except `warn`/`error`)

### Prettier

```json
{
  "semi": false,
  "singleQuote": false,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Path Aliases

```typescript
// tsconfig.json paths
"~/*": ["./src/*"]
"~lib/*": ["./src/lib/*"]
"~types": ["./src/types/index.ts"]
"~components/*": ["./src/components/*"]

// Usage
import { cn } from "~lib/utils"
import { type Platform } from "~types"
```

---

## Extension-Specific Patterns

### Hybrid Loading Strategy

For rules and configuration that need updates without Chrome Web Store review:

```typescript
// 1. Bundle rules as fallback
import bundledRules from "../../rules/platform.json";

const BUNDLED_RULES = bundledRules as OptimizationRule[];

// 2. Fetch remote rules with validation
async function fetchRemoteRules(
  platform: string,
): Promise<OptimizationRule[] | null> {
  try {
    const response = await fetch(`${GITHUB_PAGES_URL}/rules/${platform}.json`);
    const data = await response.json();

    // Validate with Zod
    const result = RulesArraySchema.safeParse(data);
    if (!result.success) {
      return null; // Fall back to bundled
    }

    return result.data;
  } catch {
    return null; // Fall back to bundled
  }
}

// 3. Cache in chrome.storage.local with expiration
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function cacheRules(
  platform: string,
  rules: OptimizationRule[],
): Promise<void> {
  await chrome.storage.local.set({
    [`rules_cache_${platform}`]: {
      rules,
      fetchedAt: Date.now(),
      source: "remote",
    },
  });
}

// 4. Load with cache-first strategy
async function loadRules(platform: string): Promise<OptimizationRule[]> {
  // Try cache first
  const cached = await getCachedRules(platform);
  if (cached && Date.now() - cached.fetchedAt < CACHE_DURATION_MS) {
    return cached.rules;
  }

  // Try remote
  const remote = await fetchRemoteRules(platform);
  if (remote) {
    await cacheRules(platform, remote);
    return remote;
  }

  // Fall back to bundled
  return BUNDLED_RULES;
}
```

### Type Guards for Message Validation

Always validate messages with type guards:

```typescript
interface OptimizeRequest {
  type: "START_OPTIMIZATION";
  draft: string;
  platform: Platform;
}

const VALID_PLATFORMS: Platform[] = [
  "openai",
  "anthropic",
  "google",
  "unknown",
];

function isOptimizeRequest(data: unknown): data is OptimizeRequest {
  if (!data || typeof data !== "object") return false;

  const request = data as Record<string, unknown>;

  return (
    request.type === "START_OPTIMIZATION" &&
    typeof request.draft === "string" &&
    request.draft.trim().length > 0 &&
    VALID_PLATFORMS.includes(request.platform as Platform)
  );
}

// Usage
port.onMessage.addListener((message: unknown) => {
  if (!isOptimizeRequest(message)) {
    sendError(port, "INVALID_REQUEST", "Invalid message format");
    return;
  }

  // message is now typed as OptimizeRequest
  handleRequest(message);
});
```

### Output Cleaning Patterns

For AI responses, always clean and extract the desired content:

```typescript
/**
 * Extracts content from XML tags, stripping meta-commentary
 */
function cleanModelOutput(rawOutput: string): string {
  // Try to extract from structured tags
  const match = /<result>([\s\S]*?)<\/result>/i.exec(rawOutput);

  if (match && match[1]) {
    return match[1].trim();
  }

  // Fallback: strip common meta-phrases
  const cleaned = rawOutput
    .replace(/^(?:here is|here's|sure,?\s*|okay,?\s*)/i, "")
    .replace(/^(?:the\s+)?(?:optimized|improved|rewritten)\s+prompt:?\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();

  return cleaned || rawOutput.trim();
}
```

---

## Architecture Patterns Summary

### Phase 1: Core Patterns

1. **Plasmo CSUI** - Use `getOverlayAnchor` for automatic lifecycle management
2. **Main World Injection** - For React/Vue compatibility via page context execution
3. **Port-Based Messaging** - For streaming and long-lived connections

### Phase 2: Performance Patterns

1. **Session Caching** - Reuse AI sessions when system prompt matches
2. **Streaming** - Token-by-token updates for better UX
3. **Output Cleaning** - XML tags and regex for clean AI responses

### Phase 3: Data Patterns

1. **Zod Validation** - Runtime validation for all external data
2. **Hybrid Loading** - Bundled + Remote + Cache with fallback chain
3. **Type Guards** - Validate messages before processing

### Phase 4: UI/UX Patterns

1. **Tailwind Animations** - Custom keyframes for brand identity
2. **Icon Replacement** - Semantic icons (Wrench for "tuning")
3. **Accessibility** - ARIA labels, states, and keyboard support
