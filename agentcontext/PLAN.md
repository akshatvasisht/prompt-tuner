# PLAN.md: Prompt Tuner Architecture & Refactor Strategy

## Objective

Refactor "Prompt Tuner" into an industry-standard, privacy-first Chrome extension. This plan transitions the codebase from a prototype to a production-ready architecture using Plasmo best practices, Zod runtime validation, and low-latency streaming for local AI.

## Agent Instructions

1.  **Sequential Execution:** Execute phases in order. Phase 1 establishes the architectural patterns required for Phase 2 and 3.
2.  **MCP Utilization:** actively use the provided MCP servers to validate assumptions, check documentation, and debug code before committing changes.
3.  **Atomic Commits:** Treat each checkbox as a deliverable unit.
4.  **Changelog** At the end of each phase, list out what has been done (finalized) in CHANGELOG.md.

---

## Phase 0: Validation & Context Loading

_Before modifying code, confirm the environment and "source of truth."_

- [ ] **Baseline Code Audit**
  - Use `ls -R` to map the current file structure.
  - Use **GitHub MCP** to cross-reference the local `pipeline/` scripts with the latest actions syntax.
  - Use **Dockfork MCP** to fetch the latest "Plasmo CSUI" and "Chrome Main World" documentation to ensure implementation details in this plan are current.
- [ ] **API Compatibility Check**
  - Use **Google Developer MCP** to confirm the current signature of the `window.ai` / `LanguageModel` API (Chrome 138+). Note any discrepancies between `src/lib/ai-engine.ts` and the stable API.

---

## Phase 1: Core Architecture Refactor (Industry Standards)

_Goal: Move from ad-hoc DOM manipulation to stable, React-aware injection patterns._

### 1.1 Adopt Official Plasmo CSUI Pattern

- [ ] **Refactor `src/contents/prompt-tuner.tsx`**
  - Remove manual `MutationObserver` logic currently inside `useEffect` hooks.
  - Adopt the official `PlasmoCSUIJSX` pattern to reduce boilerplate and improve stability.
  - Export a standard `PlasmoCSUIJSX` component.
  - Define `getOverlayAnchor` to target specific platform inputs (e.g., `textarea[data-id="root"]` for ChatGPT).
  - **Outcome:** Plasmo automatically handles Shadow DOM encapsulation and lifecycle management.

### 1.2 Implement "Main World" Execution

- [ ] **Create Main World Script (`src/contents/injector.ts`)**
  - Configure `plasmo.config.ts` (or manifest) to inject this script into the `MAIN` world.
  - **Goal:** Bypass React/Vue Virtual DOM blocking. Critical for React-heavy sites (ChatGPT/Claude) that often ignore DOM changes made from an Isolated World.
  - **Logic:** Instead of dispatching standard `input` events, interact directly with the host site’s internal state or dispatch native events that React cannot ignore.
- [ ] **Bridge Communication**
  - Implement message passing (`window.postMessage`) between the Content Script (Isolated World) and the Injector (Main World).

### 1.3 Upgrade Messaging to "Long-Lived Ports"

- [ ] **Refactor Background Messaging**
  - Replace single-fire `sendToBackground` with `chrome.runtime.connect` in `src/background/index.ts`.
  - **Why:** Essential for streaming tokens from Gemini Nano to the UI without closing the connection.
  - **Refactor:** Create a dedicated "OptimizationPort" handler that accepts a prompt and streams back chunks.

---

## Phase 2: AI Engine & Performance

_Goal: Reduce perceived latency from 60s to <1s via streaming and caching._

**Current State:** The implementation is functional but naive (no caching, no output cleaning). This phase optimizes for production use.

### 2.1 Prompt Engineering & Output Cleaning

- [ ] **Update `src/lib/ai-engine.ts` System Prompt**
  - Implement **XML Tagging**: Instruct model to wrap output in `<result>...</result>`.
  - Implement **Few-Shot Prompting**: Add 2-3 examples of "Input -> <result>Output</result>" in the prompt.
  - **Code Change:** Refactor `optimizePrompt` to regex-match content inside tags, stripping "Here is your prompt" meta-junk.

### 2.2 Session Caching

- [ ] **Implement Global Session Cache**
  - Modify `ai-engine.ts` to store `let cachedSession: LanguageModel | null`.
  - Logic: If `systemPrompt` (rules) matches the cached prompt, re-use the session. Only call `.destroy()` if rules change or memory warning is issued.
  - **Impact:** Eliminates the ~2-3s model warm-up time per request.

### 2.3 Streaming Implementation

- [ ] **Enable Streaming in AI Engine**
  - Switch from `session.prompt()` to `session.promptStreaming()`.
  - Connect the stream iterator to the Port created in Phase 1.3.
- [ ] **Update UI for Streams**
  - Modify `SparkleWidget` state to append tokens as they arrive, rather than waiting for the `Promise` to resolve.

---

## Phase 3: Data Integrity & Pipeline (Hybrid Rules Architecture)

_Goal: Secure the supply chain and enable quarterly updates without Chrome Web Store review._

**Architecture Decision:** Hybrid Loading Strategy

- **Bundled Rules (Fallback):** `rules/*.json` files are bundled at build time as the default/fallback set
- **Dynamic Updates:** Extension checks GitHub Pages URL for updated rules on startup and periodically
- **Benefits:**
  - Security: Fallback exists if fetch fails
  - Flexibility: Quarterly updates without Chrome Web Store review delays
  - Offline Capability: Works without network using bundled rules

### 3.1 Runtime Schema Validation & Hybrid Loading

- [ ] **Install Zod** (`npm install zod`)
- [ ] **Define Schemas in `src/types/index.ts`**
  - Create `RuleSchema` validating the structure of fetched JSON rules.
  - Create `ConfigSchema` for platform detection rules.
- [ ] **Refactor `src/lib/platform-rules.ts` for Hybrid Loading**
  - **Bundled Rules:** Import `rules/*.json` files at build time as fallback/default rules
  - **Update Check:** On extension startup, fetch rules from GitHub Pages URL (e.g., `https://{org}.github.io/{repo}/rules/{platform}.json`)
  - **Validation:** Pipe fetched JSON through `RuleSchema.parse()` before use
  - **Fallback Logic:** If fetch fails, validation fails, or network unavailable → use bundled rules
  - **Caching:** Store fetched rules in `chrome.storage.local` with timestamp to avoid excessive fetches
  - **Security:** Never execute malformed configs. Always fallback to bundled rules on validation failure.

### 3.2 Dynamic Knowledge Pipeline

- [ ] **Update `pipeline/scrape.ts` & `distill.ts`**
  - Ensure scripts output valid JSON matching the Zod schema.
  - Configure scripts to save output to `rules/{platform}.json`.
- [ ] **GitHub Action Integration**
  - Use **GitHub MCP** to generate `.github/workflows/update-rules.yml`.
  - Schedule: Quarterly (or manual dispatch).
  - Task: Run pipeline → Commit changes → Deploy to GitHub Pages.
  - **Output:** Rules deployed to `gh-pages` branch at `/rules/{platform}.json` for extension to fetch.

---

## Phase 4: UI/UX & Brand Evolution

_Goal: Professionalize the visual identity._

### 4.1 Asset Replacement

- [ ] **Swap Icon**
  - Replace `Sparkles` with `Wrench` from `lucide-react`.
- [ ] **Animation Implementation**
  - Add custom Tailwind keyframe `wiggle` in `globals.css`:
    ```css
    @keyframes wiggle {
      0%,
      100% {
        transform: rotate(-15deg);
      }
      50% {
        transform: rotate(15deg);
      }
    }
    ```
  - Apply `animate-wiggle` class to the Wrench icon during `processing` state.

---

## Phase 4.5: Pipeline Infrastructure Fix (JINA Replacement)

_Goal: Replace JINA Reader API with free, self-hosted Playwright + Readability stack._

**Context:** JINA Reader API requires API key management and has rate limits. For a small-scale project with quarterly scraping of 3 documentation URLs, a self-hosted solution using Playwright (already in devDependencies) and Mozilla Readability provides:

- Zero external API dependencies
- No rate limits or quotas
- Full control over scraping logic
- Industry-standard libraries

### 4.5.1 Install Dependencies

- [ ] **Add Scraping Dependencies**
  ```bash
  npm install @mozilla/readability jsdom turndown @types/turndown
  ```

  - `@mozilla/readability`: Content extraction (same as Firefox Reader View)
  - `jsdom`: DOM parsing for Node.js
  - `turndown`: HTML to Markdown conversion
  - Note: `@playwright/test` already in devDependencies

### 4.5.2 Refactor Scraping Pipeline

- [ ] **Rewrite `pipeline/scrape.ts`**
  - Remove all JINA Reader API code
  - Implement Playwright-based fetching for JavaScript-heavy pages
  - Use Mozilla Readability for content extraction
  - Convert extracted HTML to Markdown using Turndown
  - Add fallback to simple fetch + Readability for static pages
  - **Architecture:**
    ```
    URL → Playwright (renders JS) → Readability (extracts content) → Turndown (to MD)
    ```

### 4.5.3 Update GitHub Actions Workflow

- [ ] **Modify `.github/workflows/update-rules.yml`**
  - Remove `JINA_API_KEY` environment variable reference
  - Add Playwright browser installation step (`npx playwright install chromium --with-deps`)
  - Update scraping step to use new pipeline
  - **Files to modify:**
    - `.github/workflows/update-rules.yml`

### 4.5.4 Update Documentation

- [ ] **Update `agentcontext/CHANGELOG.md`**
  - Remove references to `JINA_API_KEY` in setup instructions
  - Document new scraping architecture
- [ ] **Update any README or setup docs**
  - Remove JINA API key setup instructions
  - Document that scraping is now fully self-hosted

### 4.5.5 Test Pipeline Locally

- [ ] **Verify scraping works**
  - Run `npm run pipeline:scrape` locally
  - Confirm all 3 documentation sources are scraped successfully
  - Verify output format matches existing schema
- [ ] **Verify distillation still works**
  - Run `npm run pipeline:distill`
  - Confirm rules are generated correctly

---

## Phase 5: Compliance & Security

_Goal: Pass Chrome Web Store Manual Review._

### 5.1 Remote Code Execution (RCE) Defense

- [ ] **Audit `JSON.parse` Usage**
  - Grep codebase to ensure NO usage of `eval()` or `new Function()`.
  - Verify all rule fetching strictly treats input as data (text), not code.

### 5.2 Documentation & Policy

- [ ] **Generate `PRIVACY.md`**
  - Content: Explicitly state "No data leaves the device. All AI processing is local via Chrome built-in AI."
  - Action: Commit to `docs/` and ensure it is published via GitHub Pages.
- [ ] **Content Security Policy (CSP)**
  - Configure CSP via `plasmo.config.ts` (Plasmo generates manifest automatically).
  - Whitelist only:
    - `self`
    - `https://*.githubusercontent.com` (for rule fetching from GitHub Pages)
    - `wasm-unsafe-eval` (if required by ONNX/local runtimes, otherwise remove).

### 5.3 Store Justifications

- [ ] **Draft `STORE_ASSETS.md`**
  - Write technical justifications for `host_permissions` (ChatGPT, Claude, Gemini).
  - **Draft:** "Access is required to inject the optimized prompt text directly into the DOM of the active chat interface, which resides in the main frame of these specific origins."

---

## Phase 6: Final Verification

- [ ] **E2E Testing**
  - Use **Playwright MCP** to run the updated `tests/e2e` suite against a live ChatGPT/Claude session (if possible) or a mock.
- [ ] **Build Check**
  - Run `pnpm build` to ensure Plasmo bundles the new CSUI and Main World scripts correctly.

---

## Phase 6.5: AI Engine Refinements

_Goal: Improve robustness of the AI engine for edge cases._

### 6.5.1 Context Pruning (Input Length Handling)

Gemini Nano has a ~2K token context window. Currently, there is no input length checking in `src/lib/ai-engine.ts`, causing silent failures with long inputs.

- [ ] **Implement Token Estimation**
  - Add approximate token counting (4 chars ≈ 1 token as rough heuristic)
  - File: `src/lib/ai-engine.ts`
  - Calculate estimated tokens before calling `session.promptStreaming()`

- [ ] **Handle INPUT_TOO_LONG Errors**
  - Catch the specific error type from Gemini Nano API
  - Return user-friendly error message: "Input too long. Please shorten your prompt."
  - File: `src/lib/ai-engine.ts`

- [ ] **Optional: Implement Smart Truncation**
  - If input exceeds limit, truncate from middle (preserve start context + end intent)
  - Add `[...truncated...]` marker
  - Make this behavior configurable via settings

---

## Phase 7: Side Panel Architecture

_Goal: Convert from floating widget to Chrome Side Panel for improved stability and UX._

This phase consolidates findings from two separately generated plans:
- **Side Panel Architecture** (primary direction)
- **Architectural Pattern Adoption** (extracted patterns)

### Conflict Resolution Summary

The Architectural Pattern Adoption plan proposed modifications to files that the Side Panel Architecture plan deletes. Implementing both sequentially would result in wasted effort. The following table documents resolved conflicts:

| Conflict | Resolution | Rationale |
|----------|------------|-----------|
| `prompt-tuner.tsx` modifications | Skip - file will be deleted | Side Panel replaces floating widget with trigger button |
| `sparkle-widget.tsx` ghost overlay | Skip - file will be deleted | Side Panel provides streaming preview natively |
| `dom-injector.ts` worker bridge | Partial adoption | Simplified injection still benefits from robust messaging |
| CSS animation element observer | Adopt for trigger button | Pattern is architecture-agnostic, improves focus detection |

### Architecture Decision Record

**Decision:** Adopt Chrome Side Panel API as the primary UI surface.

**Rationale:**
1. Eliminates React state fighting by isolating UI in browser-managed panel
2. Removes floating UI positioning complexity (no more @floating-ui dependencies for main UI)
3. Persists across tab switches (better UX than floating widget)
4. Direct `chrome.runtime` messaging is more reliable than `window.postMessage` bridges
5. Provides dedicated space for streaming preview and editable result

**Trade-offs:**
- Requires user to click trigger button (slight friction increase)
- Side panel occupies screen real estate
- Limited to browsers supporting Side Panel API (Chrome 114+)

### 7.1 Manifest and Infrastructure

Update manifest and create base infrastructure for side panel.

- [ ] **Add Side Panel Permission**
  - File: `package.json` (manifest section)
  - Add `"sidePanel"` to permissions array
  - Add `side_panel.default_path: "sidepanel.html"` configuration
  - Plasmo will auto-generate `sidepanel.html` entry point

### 7.2 Side Panel UI Component

Create the main side panel interface.

- [ ] **Create `src/sidepanel.tsx`**
  - State machine with states: `idle`, `ready`, `streaming`, `complete`, `error`
  - Original text display (readonly)
  - Optimize button
  - Streaming text display (live preview during generation)
  - Editable result textarea (user can modify before accepting)
  - Accept/Cancel action buttons
  - Statistics display (applied rules, character delta)
  
- [ ] **Implement Storage-Based Communication**
  - Use `chrome.storage.session` to pass draft text from content script to panel
  - Store: `{ draftText: string, sourceTabId: number, platform: string }`
  - Listen for `chrome.storage.onChanged` to detect new drafts

- [ ] **Connect Streaming Port**
  - Reuse existing `optimize-port` handler from background
  - Display streaming chunks in real-time
  - Handle CHUNK, COMPLETE, ERROR message types

### 7.3 Trigger Button (Content Script)

Create minimal content script with trigger button.

- [ ] **Create `src/contents/trigger.tsx`**
  - Minimal floating button on right edge (40x40px collapsed)
  - Expands on hover to show "Tune" label
  - Appears when supported textarea is focused
  - Uses Plasmo CSUI pattern for Shadow DOM isolation
  
- [ ] **Implement Focus Detection**
  - Adopt CSS Animation-based element observer pattern from refined-github
  - Create `src/lib/element-observer.ts` with:
    - `@keyframes prompt-tuner-observer {}` registration
    - Style injection: `:where(${selector}):not(.pt-seen) { animation: 1ms prompt-tuner-observer; }`
    - `animationstart` event listener for reliable element detection
    - AbortSignal support for cleanup
  - This pattern is architecture-agnostic and improves reliability over MutationObserver

- [ ] **Implement Panel Opening**
  - On click: capture current textarea text
  - Store draft in `chrome.storage.session`
  - Send `OPEN_SIDE_PANEL` message to background
  - Background calls `chrome.sidePanel.open({ tabId })`

### 7.4 Text Injection (Accept Flow)

Implement the flow when user accepts optimized text.

- [ ] **Add Message Listener to Trigger**
  - Listen for `INJECT_TEXT` message from side panel
  - Extract stored active element reference
  - Inject optimized text using simplified `replaceText` function

- [ ] **Simplify `src/lib/dom-injector.ts`**
  - Remove Main World bridge complexity (Side Panel uses chrome.runtime directly)
  - Keep core injection logic: `replaceTextarea()`, `replaceContentEditable()`
  - Single entry point: `injectTextToActiveElement(text: string)`
  - Fallback chain: stored element ref → document.activeElement → selector search

- [ ] **Update Background Handler**
  - Add `OPEN_SIDE_PANEL` message handler
  - Route `INJECT_TEXT` to content script via `chrome.tabs.sendMessage`

### 7.5 Migration and Cleanup

Remove deprecated files and update dependencies.

- [ ] **Remove Deprecated Files**
  - Delete `src/contents/prompt-tuner.tsx` (replaced by trigger.tsx)
  - Delete `src/components/sparkle-widget.tsx` (logic moved to sidepanel.tsx)
  - Delete `src/contents/injector.ts` (simplified injection in trigger.tsx)

- [ ] **Update Dependencies**
  - Evaluate removal of `@floating-ui/react` (may still be useful for trigger positioning)
  - No new dependencies required (Side Panel is native Chrome API)

- [ ] **Update Tests**
  - Modify e2e tests to use trigger button → side panel flow
  - Update widget-injection tests for new trigger component
  - Add side panel state machine tests

### 7.6 Polish and Testing

Final refinements and cross-platform testing.

- [ ] **Side Panel Styles (Neobrutalist)**
  - Apply neobrutalist design system (see Phase 8 for full spec)
  - Construction yellow (#FBBF24) primary color with black accents
  - Hard offset shadows, bold 2px black borders, minimal border-radius
  - Black solid Wrench icon in panel header
  - Ensure dark mode compatibility with inverted neobrutalist palette
  - Add loading states and animations (wiggle on processing)

- [ ] **Error Handling**
  - Handle panel closed during streaming
  - Handle tab closed with pending operation
  - Handle extension context invalidated

- [ ] **Cross-Platform Testing**
  - Test trigger appearance on ChatGPT (chatgpt.com)
  - Test trigger appearance on Claude (claude.ai)
  - Test trigger appearance on Gemini (gemini.google.com)
  - Verify Accept flow injects text correctly on all platforms
  - Verify streaming preview displays correctly

### Phase 7 Files Summary

**New Files:**
| File | Purpose |
|------|---------|
| `src/sidepanel.tsx` | Main side panel React component |
| `src/contents/trigger.tsx` | Minimal floating trigger button |
| `src/lib/element-observer.ts` | CSS animation-based element detection |

**Modified Files:**
| File | Changes |
|------|---------|
| `package.json` | Add sidePanel permission and configuration |
| `src/background/index.ts` | Add OPEN_SIDE_PANEL handler |
| `src/lib/dom-injector.ts` | Simplify to single injection function |

**Deleted Files:**
| File | Reason |
|------|--------|
| `src/contents/prompt-tuner.tsx` | Replaced by trigger.tsx |
| `src/components/sparkle-widget.tsx` | Logic moved to sidepanel.tsx |
| `src/contents/injector.ts` | Simplified injection in trigger.tsx |

### Phase 7 Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Side Panel API not supported | Minimum Chrome 114 requirement; document in README |
| CSS animation detection fails | Keep MutationObserver as fallback in element-observer.ts |
| User misses trigger button | Add keyboard shortcut (Ctrl+Shift+T) to open panel |
| Streaming interrupted | Store partial result; allow retry from last state |

### Preserved Architectural Patterns

The following patterns from external repositories inform this implementation (logic only, no copied code):

**CSS Animation-Based Element Detection (from refined-github):**
- Concept: Use CSS `animation` property to detect when matching elements appear in DOM
- Why: More performant than MutationObserver for element appearance detection
- Application: `src/lib/element-observer.ts` for trigger button focus detection

**Request Queue Pattern (from Harper):**
- Concept: Queue RPC requests with resolve/reject, process sequentially, timeout handling
- Why: Prevents request loss and provides reliable error handling
- Application: If message reliability issues persist, consider for side panel ↔ background communication

---

## Phase 8: Visual Identity Overhaul (Neobrutalist)

_Goal: Establish construction-themed neobrutalist visual identity across all UI surfaces._

**Design Direction:** Construction yellow with black solid wrench. Neobrutalist style characterized by bold borders, hard shadows, flat colors, and minimal rounding.

### 8.1 Design System Definition

Define the neobrutalist design tokens and CSS utilities.

- [ ] **Update CSS Variables in `src/styles/globals.css`**
  - Primary: Construction Yellow `--primary: 45 93% 58%` (#FBBF24)
  - Primary Foreground: Black `--primary-foreground: 0 0% 0%` (#000000)
  - Accent: Black `--accent: 0 0% 0%`
  - Border: Black `--border: 0 0% 0%`
  - Ring: Black `--ring: 0 0% 0%`
  - Radius: Minimal `--radius: 0.25rem` (4px max, or 0 for sharp edges)
  - Background: Off-white `--background: 60 9% 98%` (#FEFCE8 - warm cream)

- [ ] **Add Neobrutalist Utilities in `tailwind.config.js`**
  - Add `boxShadow` utility: `'brutal': '4px 4px 0px 0px #000000'`
  - Add `'brutal-sm': '2px 2px 0px 0px #000000'`
  - Add `'brutal-lg': '6px 6px 0px 0px #000000'`
  - Add hover variant: `'brutal-hover': '2px 2px 0px 0px #000000'` (shadow reduces on press)

- [ ] **Define Neobrutalist Component Classes in `globals.css`**
  ```css
  .brutal-button {
    @apply border-2 border-black shadow-brutal;
    @apply hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px];
    @apply active:shadow-none active:translate-x-[4px] active:translate-y-[4px];
    @apply transition-all duration-100;
  }
  
  .brutal-card {
    @apply border-2 border-black shadow-brutal bg-background;
  }
  
  .brutal-input {
    @apply border-2 border-black focus:ring-2 focus:ring-black focus:ring-offset-2;
  }
  ```

### 8.2 Icon and Logo Update

Replace sparkle-based assets with construction wrench theme.

- [ ] **Create New `assets/icon.svg`**
  - Background: Solid construction yellow (#FBBF24), no gradients
  - Icon: Solid black wrench (simplified, bold silhouette)
  - Border: 2px black stroke around the rounded rect (neobrutalist touch)
  - Maintain 128x128 viewBox for compatibility

- [ ] **Generate `assets/icon.png`**
  - Export SVG to PNG at required sizes (16, 32, 48, 128)
  - Ensure crisp edges at all sizes

- [ ] **Update Icon References**
  - Verify `package.json` manifest points to new icon
  - Update any hardcoded icon paths

### 8.3 Popup UI Overhaul

Apply neobrutalist styling to extension popup.

- [ ] **Update `src/popup.tsx`**
  - Replace `Sparkles` icon with `Wrench` from lucide-react (solid variant)
  - Apply `brutal-card` class to status and settings sections
  - Apply `brutal-button` class to buttons
  - Update toggle switch to neobrutalist style (hard edges, black border)
  - Header: Construction yellow background with black wrench icon
  - Maintain existing functionality, only update visuals

- [ ] **Update Status Indicators**
  - Success: Green with black border
  - Error: Red with black border
  - Warning: Yellow (same as primary) with black border
  - All indicators use hard shadows, no glow effects

### 8.4 Trigger Button Styling

Apply neobrutalist styling to the floating trigger button (created in Phase 7).

- [ ] **Style `src/contents/trigger.tsx`**
  - Background: Construction yellow (#FBBF24)
  - Icon: Solid black Wrench
  - Border: 2px solid black
  - Shadow: `4px 4px 0px 0px #000000`
  - Hover: Shadow reduces, button shifts toward shadow
  - Active/Processing: Shadow disappears, button fully shifted
  - Size: 40x40px collapsed, expands on hover with "Tune" label
  - Animation: Wrench wiggles during processing state

### 8.5 Side Panel Branding

Ensure side panel follows neobrutalist design (coordinates with Phase 7.6).

- [ ] **Side Panel Header**
  - Background: Construction yellow
  - Title: "Prompt Tuner" in bold black text
  - Icon: Solid black Wrench

- [ ] **Side Panel Components**
  - Original text area: `brutal-input` styling (readonly, muted background)
  - Optimized text area: `brutal-input` styling (editable, white background)
  - Optimize button: `brutal-button` with yellow background
  - Accept button: `brutal-button` with green background, black text
  - Cancel button: `brutal-button` with white background, black text
  - Stats display: `brutal-card` styling

### 8.6 Component Library Updates

Update existing shadcn/ui components to match neobrutalist theme.

- [ ] **Update `src/components/ui/button.tsx`**
  - Add `brutal` variant with neobrutalist styling
  - Default variant can remain for non-branded contexts
  - Ensure all size variants work with brutal shadow offsets

- [ ] **Consider Adding shadcn Components**
  - `npx shadcn@latest add switch` - for settings toggle (then customize)
  - `npx shadcn@latest add card` - for panel sections (then customize)
  - Apply neobrutalist overrides after installation

### Phase 8 Files Summary

**Modified Files:**
| File | Changes |
|------|---------|
| `src/styles/globals.css` | Neobrutalist CSS variables and utility classes |
| `tailwind.config.js` | Brutal shadow utilities, reduced border-radius |
| `assets/icon.svg` | Construction yellow + black wrench design |
| `assets/icon.png` | Regenerated from new SVG |
| `src/popup.tsx` | Neobrutalist styling, Wrench icon |
| `src/components/ui/button.tsx` | Add brutal variant |
| `src/contents/trigger.tsx` | Neobrutalist trigger styling (from Phase 7) |
| `src/sidepanel.tsx` | Neobrutalist panel styling (from Phase 7) |

### Phase 8 Design Reference

**Color Palette:**
| Name | HSL | Hex | Usage |
|------|-----|-----|-------|
| Construction Yellow | 45 93% 58% | #FBBF24 | Primary, backgrounds, accents |
| Black | 0 0% 0% | #000000 | Borders, shadows, icons, text |
| Off-White | 60 9% 98% | #FEFCE8 | Backgrounds (light mode) |
| Dark Gray | 0 0% 10% | #1A1A1A | Backgrounds (dark mode) |

**Neobrutalist Principles Applied:**
- Heavy 2px black borders on all interactive elements
- Hard offset shadows (4px 4px, no blur, black)
- Minimal or zero border-radius (4px max)
- Flat colors, no gradients or glassmorphism
- Bold typography
- Visible structure (borders and shadows always present)
- Interactive feedback via shadow/position shifts
