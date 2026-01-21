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
- **Intent over implementation** — Comments should explain *why*, not *what*. Let the code speak for itself.
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

| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `userInput`, `isProcessing` |
| Functions | camelCase | `optimizePrompt()`, `handleClick()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| Types/Interfaces | PascalCase | `OptimizeRequest`, `AIAvailability` |
| Enums | PascalCase | `ErrorCode`, `WidgetStatus` |
| Components | PascalCase | `SparkleWidget`, `PromptInput` |
| Files (components) | kebab-case | `sparkle-widget.tsx`, `ai-engine.ts` |
| Test files | Same as source + `.test` | `ai-engine.test.ts` |

### Type Definitions

```typescript
// Prefer interfaces for object shapes
interface OptimizeRequest {
  draft: string
  platform: Platform
  context?: string
}

// Use type for unions, intersections, and aliases
type Platform = "openai" | "anthropic" | "google" | "unknown"
type SupportedPlatform = Exclude<Platform, "unknown">

// Use type-only imports when importing types
import { type OptimizeRequest, PromptTunerError } from "~types"
```

### Type Safety Rules

1. **Never use `any`** — Use `unknown` and narrow with type guards if needed.
2. **Avoid type assertions** — Prefer type guards or generics over `as` casts.
3. **Explicit return types** — Public functions must have explicit return type annotations.
4. **Null checks** — Use optional chaining (`?.`) and nullish coalescing (`??`) appropriately.
5. **Index signatures** — Always handle potentially undefined values from index access.

```typescript
// Bad: Unsafe index access
const value = items[index]
value.doSomething()

// Good: Safe index access
const value = items[index]
if (value !== undefined) {
  value.doSomething()
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
    const session = await createSession()
    return await session.prompt(draft)
  } catch (error) {
    throw new PromptTunerError(
      error instanceof Error ? error.message : "Unknown error",
      "AI_GENERATION_FAILED"
    )
  } finally {
    session?.destroy()
  }
}
```

### Error Handling

Use the custom `PromptTunerError` class for all extension errors:

```typescript
export class PromptTunerError extends Error {
  code: ErrorCode

  constructor(message: string, code: ErrorCode) {
    super(message)
    this.name = "PromptTunerError"
    this.code = code
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
  | "UNKNOWN_ERROR"
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

### Hook Rules

1. **Follow Rules of Hooks** — Only call hooks at the top level of components.
2. **Use `useCallback`** for functions passed to child components.
3. **Use `useMemo`** for expensive computations.
4. **Use `useRef`** for mutable values that shouldn't trigger re-renders.
5. **Custom hooks** must start with `use` prefix.

```typescript
// Good: Proper hook usage
const handleClick = useCallback(async (): Promise<void> => {
  if (isProcessingRef.current) return
  // ... processing logic
}, [dependencies])

const combinedStyles = useMemo(
  () => ({
    ...floatingStyles,
    zIndex: 2147483647,
  }),
  [floatingStyles]
)
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

| Event Type | Handler Prefix | Example |
|------------|----------------|---------|
| Click | `handle` | `handleClick`, `handleSubmit` |
| Change | `handle` | `handleChange`, `handleInputChange` |
| Callbacks (props) | `on` | `onProcessingComplete`, `onChange` |

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
import { describe, it, expect, vi, beforeEach } from "vitest"
import { functionUnderTest } from "~lib/module"

describe("module-name", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("functionUnderTest", () => {
    it("should return expected result when given valid input", async () => {
      // Arrange
      const input = "test"

      // Act
      const result = await functionUnderTest(input)

      // Assert
      expect(result).toBe("expected")
    })

    it("should throw error when given invalid input", async () => {
      await expect(functionUnderTest(null)).rejects.toThrow(ExpectedError)
    })
  })
})
```

### Test Naming

- Use descriptive names that explain the expected behavior.
- Format: `should [expected behavior] when [condition]`
- Group related tests with nested `describe` blocks.

### Coverage Requirements

| Metric | Minimum |
|--------|---------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

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
  draft: string
  platform: Platform
}

const handler: PlasmoMessaging.MessageHandler<OptimizeRequest, OptimizeResponse> = 
  async (req, res) => {
    if (!req.body?.draft || typeof req.body.draft !== "string") {
      res.send({ success: false, error: { code: "INVALID_REQUEST", message: "Invalid draft" } })
      return
    }
    // Process validated input
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
    return typeof chrome !== "undefined" && 
           chrome.runtime && 
           typeof chrome.runtime.id !== "undefined"
  } catch {
    return false
  }
}
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
  const abortController = new AbortController()

  fetchData(abortController.signal)

  return () => {
    abortController.abort()
  }
}, [])
```

### Bundle Size

- Use tree-shakeable imports (`import { specific } from "library"`).
- Avoid large dependencies for simple functionality.
- Analyze bundle size regularly with build tools.

---

## Documentation Standards

### JSDoc Comments

All public functions must have JSDoc comments:

```typescript
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
  options?: AIOptimizeOptions
): Promise<string>
```

### Section Separators

Use section separators to organize code:

```typescript
// =============================================================================
// Constants
// =============================================================================

const MAX_RETRIES = 3

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

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/description` | `feature/streaming-optimization` |
| Bug fix | `fix/description` | `fix/widget-positioning` |
| Hotfix | `hotfix/description` | `hotfix/security-patch` |
| Refactor | `refactor/description` | `refactor/ai-engine-cleanup` |
| Docs | `docs/description` | `docs/api-documentation` |

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
