# Chrome Web Store Submission Assets

**Extension**: Prompt Tuner  
**Version**: 0.1.0  
**Submission Date**: TBD (pre-submission)  
**Category**: Productivity

## Table of Contents

1. [Extension Description](#1-extension-description)
2. [Permissions Justification](#2-permissions-justification)
3. [Host Permissions Technical Justification](#3-host-permissions-technical-justification)
4. [Single Purpose Statement](#4-single-purpose-statement)
5. [Privacy Practices](#5-privacy-practices)
6. [Store Listing Content](#6-store-listing-content)
7. [Screenshots and Media](#7-screenshots-and-media)
8. [Developer Information](#8-developer-information)
9. [Technical Requirements](#9-technical-requirements)
10. [Compliance Checklist](#10-compliance-checklist)
11. [Frequently Asked Questions](#11-frequently-asked-questions)
12. [Reviewer Notes](#12-reviewer-notes-for-chrome-web-store-team)
13. [Post-Submission Checklist](#13-post-submission-checklist)

## 1. Extension Description

### 1.1 Short Description (132 characters max)

```
Privacy-first prompt optimizer for ChatGPT, Claude & Gemini using Chrome's local AI. No data leaves your device.
```

### 1.2 Detailed Description

```
Prompt Tuner is a privacy-first Chrome extension that optimizes your prompts for ChatGPT, Claude, and Google Gemini using Chrome's built-in AI.

KEY FEATURES
- One-click prompt optimization with local AI processing
- Platform-specific rules for ChatGPT, Claude, and Gemini
- 100% private - all processing happens on your device
- Works fully offline - zero network activity at runtime
- Optimization strategies updated quarterly via extension releases

PRIVACY COMMITMENT
All AI processing uses Chrome's built-in Gemini Nano model. No data leaves your device. No accounts, tracking, or data collection.

HOW IT WORKS
1. Visit ChatGPT, Claude, or Gemini
2. Select your prompt text (or focus the textarea)
3. Press Cmd+Shift+K (Mac) / Ctrl+Shift+K (Win/Linux), or click the sparkle icon
4. Choose an action from the command palette
5. Watch the optimized prompt stream in real-time
6. Press Enter to insert, or Undo within 8 seconds

6 PROMPT ENGINEERING ACTIONS
- Optimize: General-purpose improvement
- Few-Shot: Add demonstrative examples
- Chain of Thought: Step-by-step reasoning structure
- Assign a Role: Add persona and context framing
- Define Output: Specify format and structure
- Add Constraints: Set length, detail, and scope limits

TECHNICAL DETAILS
- Requires Chrome 138+ with Gemini Nano enabled
- Uses Chrome's Prompt API for local AI processing
- Open source (MIT License)
- Built with Plasmo framework for reliability

PLATFORM-SPECIFIC OPTIMIZATIONS
- ChatGPT: Clear instructions, few-shot examples, role assignment
- Claude: XML structure, explicit constraints, document handling
- Gemini: Markdown formatting, concrete examples, task decomposition

SECURITY AND PRIVACY
- No external API calls for AI processing
- No user tracking or analytics
- All data processed locally in your browser
- Regularly audited for security vulnerabilities
- Full source code available on GitHub

Open source and MIT licensed. View the code at: https://github.com/akshatvasisht/prompt-tuner

Need help? Visit our documentation: https://github.com/akshatvasisht/prompt-tuner/docs
Report issues: https://github.com/akshatvasisht/prompt-tuner/issues
```

### 1.3 Version Update Notes

```
Version 0.1.0 - Initial Release

Features:
- Command palette with 6 prompt engineering actions (Cmd+Shift+K / Ctrl+Shift+K)
- Real-time streaming output via long-lived Chrome ports
- Platform-specific optimization rules for ChatGPT, Claude, and Gemini
- MiniPill trigger button near selected text
- One-click insert with 8-second undo
- Focus-trapped command palette with full keyboard navigation
- Smart AI lifecycle: proactive warming, graceful shutdown, session caching
- 6-step setup wizard with Gemini Nano guidance

Privacy and Security:
- 100% on-device processing via Gemini Nano
- No data collection, tracking, or transmission
- Strict Content Security Policy with no external `connect-src`
- Optimization rules bundled with the extension - zero runtime network activity
```

## 2. Permissions Justification

### 2.1 Permissions Table

| Permission  | Justification                                                                                                            | User-Facing Benefit                                                       | Privacy Impact                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `storage`   | Cache optimization results (keyed by prompt hash + rules fingerprint) so repeated optimizations are instant              | Faster repeat optimizations, reduced AI compute                           | **Low** - Only stores non-personal data (hashed inputs and model outputs). No account or identity data. |
| `alarms`    | Keep the background service worker alive during active streaming optimizations so long responses finish reliably         | Reliable completion of streaming optimizations without interrupted output | **None** - No data collection. Scheduling only; no external calls.                                      |
| `activeTab` | Detect which LLM platform (ChatGPT/Claude/Gemini) the user is currently on to apply platform-specific optimization rules | Tailored optimizations for each AI platform, better results               | **Minimal** - Only reads current tab URL to detect platform. No content access.                         |

### 2.2 Host Permissions Table

| Host Permission               | Justification                                                                               | User-Facing Benefit                                   | Privacy Impact                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `https://chat.openai.com/*`   | Inject optimization widget into ChatGPT interface to enhance user prompts before submission | In-context prompt improvement without leaving ChatGPT | **Low** - Only accesses DOM to inject UI and read draft prompts on user action. Does not access chat history. |
| `https://chatgpt.com/*`       | Inject optimization widget into ChatGPT interface (alternate domain)                        | Same as above                                         | Same as above                                                                                                 |
| `https://claude.ai/*`         | Inject optimization widget into Claude interface to enhance user prompts before submission  | In-context prompt improvement without leaving Claude  | **Low** - Only accesses DOM to inject UI and read draft prompts on user action. Does not access chat history. |
| `https://bard.google.com/*`   | Inject optimization widget into Google Bard/Gemini interface (legacy domain)                | In-context prompt improvement without leaving Gemini  | **Low** - Only accesses DOM to inject UI and read draft prompts on user action. Does not access chat history. |
| `https://gemini.google.com/*` | Inject optimization widget into Google Gemini interface                                     | Same as above                                         | Same as above                                                                                                 |

## 3. Host Permissions Technical Justification

### 3.1 Why Host Permissions Are Required

The extension requires `host_permissions` for specific LLM platforms to:

#### 1. DOM Injection

Insert the optimization widget (icon) adjacent to the textarea where users compose prompts. This requires:

- Access to the page's DOM structure
- Ability to query for text input elements
- Injection of a scoped overlay element into the main document

#### 2. Input Detection

Monitor focus events on text input elements to determine when the user is actively composing a prompt and activate the widget. This requires:

- Event listeners on input elements
- Focus tracking for widget positioning
- Active element detection

#### 3. Text Replacement

After optimization, replace the original prompt text with the optimized version in the textarea. This is done via Main World script injection to bypass React/Vue Virtual DOM. This requires:

- Direct DOM manipulation in page context
- Native property setters for React compatibility
- Event dispatching for framework detection

#### 4. Platform Detection

Identify which LLM platform is active to load the correct platform-specific optimization rules. This requires:

- URL pattern matching
- DOM element detection (platform-specific selectors)

### 3.2 What the Extension Does NOT Do

**Important Privacy Guarantees**:

- Does NOT access existing chat history or previous messages
- Does NOT read content from other tabs or windows
- Does NOT transmit any data from these domains to external servers
- Does NOT modify page content except user's draft prompt (on user action)
- Does NOT inject ads, trackers, or analytics
- Does NOT store prompts or chat data persistently

**Read-Only Except**:
The extension is read-only on these domains except for:

1. Inserting the widget UI (scoped overlay, `--pt-*` CSS namespace)
2. Replacing the user's draft prompt text when they click "optimize"

All other page content remains unchanged.

### 3.3 Technical Architecture

```
User's Draft Prompt
       |
       v
[Content Script] --> Detects focused textarea
       |
       v
[Background Service Worker] --> Processes with Gemini Nano (local)
       |
       v
[Main World Injector] --> Replaces text in React/Vue textarea
       |
       v
User Reviews & Submits
```

**Key Point**: All processing happens locally via Chrome's built-in AI. No data from `chat.openai.com`, `claude.ai`, or `gemini.google.com` is sent to external servers.

## 4. Single Purpose Statement

### 4.1 Primary Purpose

**Prompt Tuner has a single, clearly defined purpose:**

> **Optimize user prompts for LLM chat interfaces using local AI processing.**

### 4.2 Feature Alignment

All features support this core function:

| Feature             | Purpose Alignment                                                     |
| ------------------- | --------------------------------------------------------------------- |
| Platform Detection  | Determines which LLM is active, applies correct optimization rules    |
| Local AI Processing | Processes prompts via Gemini Nano, generates optimized output         |
| UI Widget           | Provides user control, initiates optimization on demand               |
| Streaming Display   | Shows tokens as generated, improves perceived performance             |
| Scoped CSS Overlay  | Isolates UI via `--pt-*` namespace, prevents conflicts with host page |
| Main World Bridge   | Bypasses React Virtual DOM, ensures text replacement works            |

**Conclusion**: Every component serves the single purpose of prompt optimization.

### 4.3 What the Extension Does NOT Include

The extension intentionally excludes:

- User tracking or analytics
- Advertising or monetization features
- Social media integration
- Unrelated productivity tools
- Data collection or telemetry
- Third-party service integrations of any kind

**Compliance**: Meets Chrome Web Store Single Purpose Policy.

## 5. Privacy Practices

### 5.1 Privacy Policy

**Full Policy URL**: https://github.com/akshatvasisht/prompt-tuner/blob/main/docs/PRIVACY.md

**Summary**:

- No data collection
- No user tracking
- No external AI APIs
- All processing local (Chrome's Gemini Nano)
- Optimization rules bundled with the extension (zero runtime network activity)
- Open source for transparency

### 5.2 Data Handling Disclosure

**Required Chrome Web Store Declarations**:

#### User Data Collection

- Personally identifiable information: **NO**
- Health information: **NO**
- Financial and payment information: **NO**
- Authentication information: **NO**
- Personal communications: **NO** (prompts processed locally, not collected)
- Location: **NO**
- Web history: **NO**
- User activity: **NO**
- Website content: **NO** (only user's draft prompt, on demand)

**Data Handling**: This extension does not collect or transmit user data

#### Data Usage

Since no data is collected:

- Not used for any purpose
- Not transmitted off device
- Not sold to third parties
- Not used for purposes unrelated to core functionality

#### Certification

**Developer Certification Statement**:

```
I certify that this extension complies with the Chrome Web Store Developer Program Policies,
including the User Data Privacy policy. This extension:
- Does not collect user data
- Does not transmit user data off device
- Does not use host permissions for purposes unrelated to its single purpose
- Processes all user data locally via Chrome's built-in AI
```

## 6. Store Listing Content

### 6.1 Primary Category

**Productivity**

Rationale: Enhances user productivity by improving prompt quality for AI interactions.

### 6.2 Secondary Category (Optional)

**Developer Tools**

Rationale: Useful for developers and power users who frequently use AI assistants.

### 6.3 Tags/Keywords

```
prompt engineering, AI assistant, ChatGPT, Claude, Gemini, prompt optimization,
local AI, privacy, productivity, prompt helper, AI tools, writing assistant
```

### 6.4 Language

**Primary**: English (US)

**Localization Status**: Not yet localized (English only in v0.1.0)

## 7. Screenshots and Media

### 7.1 Required Screenshots (1280x800 or 640x400)

**Screenshot 1: Widget on ChatGPT**

- **File**: `store-assets/screenshot-1-chatgpt.png`
- **Caption**: "One-click prompt optimization on ChatGPT"
- **Content**: Shows widget icon next to ChatGPT textarea

**Screenshot 2: Optimization in Action**

- **File**: `store-assets/screenshot-2-optimizing.png`
- **Caption**: "Real-time optimization with streaming output"
- **Content**: Shows widget with "Optimizing..." state and streaming text

**Screenshot 3: Before/After Comparison**

- **File**: `store-assets/screenshot-3-comparison.png`
- **Caption**: "Improved prompt with platform-specific best practices"
- **Content**: Side-by-side before/after prompt comparison

**Screenshot 4: Claude Integration**

- **File**: `store-assets/screenshot-4-claude.png`
- **Caption**: "Integration on Claude with XML structuring"
- **Content**: Widget on Claude.ai interface

**Screenshot 5: Gemini Integration**

- **File**: `store-assets/screenshot-5-gemini.png`
- **Caption**: "Optimizes prompts for Google Gemini with markdown formatting"
- **Content**: Widget on Gemini interface

### 7.2 Promotional Images

**Small Promotional Tile** (440x280):

- **File**: `store-assets/promo-small.png`
- **Content**: Extension icon + "Prompt Tuner" branding + "Local AI Privacy"

**Large Promotional Tile** (920x680):

- **File**: `store-assets/promo-large.png`
- **Content**: Feature highlights + before/after example

**Marquee Promotional Tile** (1400x560):

- **File**: `store-assets/promo-marquee.png`
- **Content**: Hero image showing multi-platform support + key benefits

### 7.3 Extension Icon

**Icon Sizes Required**:

- 16x16: `assets/icon-16.png`
- 48x48: `assets/icon-48.png`
- 128x128: `assets/icon-128.png`

**Current Icon**: Wrench on gradient background

**Design Notes**:

- Simple, recognizable at small sizes
- Represents "tuning" or "optimization"
- Consistent with privacy-focused, tool-oriented branding

### 7.4 Video Demo (Optional but Recommended)

**YouTube Video**:

- **Length**: 30-60 seconds
- **Content**:
  1. Open ChatGPT, type basic prompt
  2. Click optimization icon
  3. Show streaming optimization
  4. Highlight improved prompt
  5. Submit and show better response
- **Voiceover**: "Prompt Tuner - Optimize your AI prompts locally and privately"

## 8. Developer Information

### 8.1 Developer Account

**Developer Name**: Akshat Vasisht
**Email**: akshat2vasisht@gmail.com
**Website**: https://github.com/akshatvasisht/prompt-tuner

### 8.2 Support Resources

**Support URL**: https://github.com/akshatvasisht/prompt-tuner/issues
**Support Email**: akshat2vasisht@gmail.com

**Documentation**:

- Setup & Troubleshooting: `docs/SETUP.md`
- Architecture: `docs/ARCHITECTURE.md`
- Contributing: `CONTRIBUTING.md`
- Changelog: `CHANGELOG.md`

**Community**:

- GitHub Issues: For bug reports and feature requests
- GitHub Discussions: For questions and community support

### 8.3 Update Frequency

**Extension Updates**: As needed (bug fixes, security patches)  
**Rule Updates**: Quarterly, bundled into each extension release (rules are regenerated by CI and committed to the repo)

**Notification**: Users receive updated rules through normal Chrome Web Store extension updates.

## 9. Technical Requirements

### 9.1 Minimum Browser Version

**Chrome 138+** (required for Gemini Nano)

**Compatibility Check**:

- Extension displays error if Chrome version < 138
- Links to chrome://components for Gemini Nano setup

### 9.2 Platform Support

- Windows: Supported
- macOS: Supported
- Linux: Supported
- Chrome OS: Supported

**Not Supported**:

- Mobile (Chrome on Android/iOS) - Chrome built-in AI not available on mobile

### 9.3 Dependencies

**Runtime Dependencies**:

- Chrome's Gemini Nano (Optimization Guide On Device Model)

**No External Services**:

- No API keys required
- No user accounts
- No paid subscriptions

## 10. Compliance Checklist

### 10.1 Chrome Web Store Policies

- **Single Purpose**: One purpose (prompt optimization) - PASS
- **Minimal Permissions**: Only essential permissions requested - PASS
- **User Data Privacy**: No data collection or transmission - PASS
- **Prohibited Products**: No violations (no mining, no cheats, etc.) - PASS
- **Deceptive Installation Tactics**: Clear installation flow - PASS
- **Spam and Abuse**: No manipulative practices - PASS
- **Content Policies**: Appropriate content only - PASS
- **Intellectual Property**: All assets original or properly licensed - PASS

### 10.2 Security Requirements

- **No Remote Code**: All code bundled in extension - PASS
- **No Obfuscation**: Source code readable, open source - PASS
- **CSP Configured**: Restrictive Content Security Policy - PASS
- **Secure Communication**: No runtime network activity - PASS
- **Data Validation**: Rules are bundled static JSON, reviewed in-repo before each release - PASS

### 10.3 Quality Guidelines

- **Functionality**: Works as described - PASS
- **User Experience**: Intuitive UI, clear feedback - PASS
- **Performance**: Lightweight, no slowdowns - PASS
- **Documentation**: Comprehensive docs provided - PASS
- **Support**: GitHub issues for support - PASS

## 11. Frequently Asked Questions

**Q: Does Prompt Tuner send my prompts to a server?**
No. All processing happens locally on your device using Chrome's built-in Gemini Nano model. No prompts, text, or personal data ever leave your browser.

**Q: Why does it require Chrome 138+?**
Prompt Tuner uses the Chrome Prompt API (Gemini Nano), which is only available in Chrome 138 and later. Earlier versions don't include the on-device AI model.

**Q: How do I set up Gemini Nano?**
Go to `chrome://flags/#optimization-guide-on-device-model`, enable it, restart Chrome, then visit `chrome://components` and click "Check for update" next to "Optimization Guide On Device Model." The setup wizard walks you through this on first install.

**Q: Which platforms does it work on?**
ChatGPT (chat.openai.com, chatgpt.com), Claude (claude.ai), and Google Gemini (gemini.google.com). The extension detects the platform automatically and applies platform-specific optimization rules.

**Q: What are the 6 actions?**
Optimize (general improvement), Few-Shot (add examples), Chain of Thought (step-by-step reasoning), Assign a Role (persona/context), Define Output (format/structure), and Add Constraints (length/detail limits).

**Q: Can I undo an applied optimization?**
Yes. After inserting an optimized prompt, a toast notification appears with an "Undo" button for 8 seconds. Click it to restore your original text.

**Q: Why does the extension need host permissions for ChatGPT/Claude/Gemini?**
To inject the optimization UI overlay and replace text in the platform's textarea. No chat history or page content is read - only the text you've selected when you click optimize.

**Q: How often are optimization rules updated?**
Rules are bundled with the extension and refreshed in each release. A quarterly GitHub Actions job regenerates the rule files from source documentation and commits them to the repository; users receive updates via normal Chrome Web Store extension updates.

**Q: Does it work offline?**
Yes, fully. After Gemini Nano is downloaded by Chrome, the extension makes zero network requests. All rules are bundled and the AI runs entirely on-device.

**Q: Is it open source?**
Yes. The full source code is available on GitHub under the MIT License.

## 12. Reviewer Notes (for Chrome Web Store team)

### 12.1 Testing Instructions

**For Chrome Web Store Reviewers:**

1. **Prerequisites**:
   - Chrome 138+ installed
   - Navigate to `chrome://components`
   - Verify "Optimization Guide On Device Model" is installed and ready
   - If not, click "Check for update"

2. **Installation**:
   - Load unpacked extension or install from CRX
   - Grant requested permissions (no additional prompts)

3. **Test on ChatGPT**:
   - Visit `https://chat.openai.com`
   - Click on the prompt textarea
   - Verify optimization icon appears
   - Type: "Tell me about dogs"
   - Click optimization icon
   - Verify optimization completes (streaming text)
   - Verify optimized prompt appears in textarea
   - Verify prompt is improved with structure/examples

4. **Test on Claude**:
   - Visit `https://claude.ai`
   - Repeat steps above
   - Verify XML tags and structure in optimized prompt

5. **Test on Gemini**:
   - Visit `https://gemini.google.com`
   - Repeat steps above
   - Verify markdown formatting in optimized prompt

6. **Verify Privacy**:
   - Open DevTools, then Network tab
   - Perform optimization
   - Verify **zero network requests** after extension load - all processing is local
   - Verify no analytics beacons
   - Verify no third-party API calls

7. **Verify Permissions**:
   - Extension only accesses specified hosts
   - No permission escalation prompts
   - Storage usage minimal (<1MB)

### 12.2 Common Issues and Solutions

**Issue**: "Gemini Nano not available" error  
**Solution**: Ensure Chrome 138+ and Gemini Nano installed at `chrome://components`

**Issue**: Widget doesn't appear  
**Solution**: Verify host_permissions granted for current site

**Issue**: Text replacement doesn't work  
**Solution**: Main World injector requires page reload after installation

### 12.3 Source Code Review

**Open Source Repository**: https://github.com/akshatvasisht/prompt-tuner

**Key Files for Review**:

- `src/contents/Overlay.tsx` - UI injection
- `src/lib/ai-engine.ts` - Local AI processing
- `src/lib/platform-rules.ts` - Bundled rule loader
- `docs/PRIVACY.md` - Privacy policy

**Build Verification**:

```bash
git clone [repository]
cd prompt-tuner
npm install
npm run build
# Compare build/chrome-mv3-prod with submitted CRX
```

## 13. Post-Submission Checklist

### 13.1 After Approval

- Update GitHub README with Chrome Web Store link
- Create release tag (v0.1.0)
- Publish privacy policy to GitHub Pages
- Monitor initial user feedback
- Set up GitHub Issues templates
- Update CHANGELOG.md with release date

### 13.2 Marketing

- Social media announcement (Twitter, LinkedIn)
- Product Hunt submission
- Write blog post about local AI privacy
- Share on Reddit (r/chrome_extensions, r/ChatGPT)
- Submit to extension directories (alternativeto.net, etc.)

### 13.3 Monitoring

- Track Chrome Web Store reviews
- Monitor GitHub Issues for bugs
- Set up quarterly rule update schedule
- Plan next version features based on feedback

## Appendix A: Submission Form Answers

### Distribution

**Visibility**: Public  
**Regions**: All countries  
**Pricing**: Free

### Privacy

**Data Collection**: No  
**Data Certification**: This extension does not collect or transmit user data

### Justifications

**Why does your extension need 'storage' permission?**

```
To cache optimization results locally, keyed by a hash of the user's prompt and
the bundled rules fingerprint, so repeated optimizations return instantly and
avoid redundant AI compute. No personal or account data is stored.
```

**Why does your extension need 'alarms' permission?**

```
To keep Chrome's MV3 service worker alive during active streaming optimizations,
preventing the worker from being terminated mid-stream and truncating output.
```

**Why does your extension need 'activeTab' permission?**

```
To detect which LLM platform (ChatGPT/Claude/Gemini) the user is currently on,
allowing the extension to apply platform-specific optimization rules for better results.
```

**Why does your extension need host permissions?**

```
To inject the optimization widget UI into the LLM chat interfaces and enable
text replacement in the prompt textarea. All processing happens locally via
Chrome's built-in AI. No data from these domains is transmitted to external servers.
```

**Single Purpose Description**:

```
Optimize user prompts for LLM chat interfaces using local AI processing. All features
support this core function: platform detection, local AI processing, UI widget, and
rule updates.
```

**Remote Code**:

```
No remote code is used. Optimization rules are static JSON data files bundled
inside the extension; the extension makes no network requests at runtime.
```

## Appendix B: Certification Statement

**Developer Certification**:

I certify that:

1. This extension complies with Chrome Web Store Developer Program Policies
2. This extension has a single purpose: optimizing prompts for LLM interfaces
3. This extension does not collect, transmit, or sell user data
4. All permissions are used only for stated purposes
5. Privacy policy is accurate and publicly accessible
6. Source code is available for review (open source)
7. Extension does not contain malicious code or vulnerabilities
8. I will maintain the extension and respond to security issues promptly

**Date**: 2026-04-18  
**Signature**: Akshat Vasisht

**Document Version**: 1.2  
**Last Updated**: April 18, 2026  
**Status**: Ready for Chrome Web Store Submission (pending 3 blockers: screenshots, promo tiles, dev account - see OPEN_ISSUES.md)
