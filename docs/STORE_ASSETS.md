# Chrome Web Store Submission Assets

**Extension**: Prompt Tuner  
**Version**: 0.1.0  
**Submission Date**: January 27, 2026  
**Category**: Productivity

---

## Table of Contents

1. [Extension Description](#1-extension-description)
2. [Permissions Justification](#2-permissions-justification)
3. [Host Permissions Technical Justification](#3-host-permissions-technical-justification)
4. [Single Purpose Statement](#4-single-purpose-statement)
5. [Privacy Practices](#5-privacy-practices)
6. [Store Listing Content](#6-store-listing-content)
7. [Screenshots and Media](#7-screenshots-and-media)
8. [Developer Information](#8-developer-information)

---

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
- Works offline after initial setup
- Automatically updates optimization strategies quarterly

PRIVACY COMMITMENT
All AI processing uses Chrome's built-in Gemini Nano model. No data leaves your device. No accounts, tracking, or data collection.

HOW IT WORKS
1. Visit ChatGPT, Claude, or Gemini
2. Write your prompt in the chat box
3. Click the optimization icon
4. Review and submit the improved prompt

WHY USE PROMPT TUNER
- Apply proven prompt engineering techniques instantly
- Platform-specific optimizations (each AI responds differently)
- Learn better prompting through examples
- Save time crafting effective prompts
- Privacy-focused: zero data transmission

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

Open source and MIT licensed. View the code at: [GitHub URL]

Need help? Visit our documentation: [Docs URL]
Report issues: [Issues URL]
```

### 1.3 Version Update Notes

```
Version 0.1.0 - Initial Release

Features:
- Local AI-powered prompt optimization
- Support for ChatGPT, Claude, and Gemini
- Platform-specific optimization rules
- Shadow DOM UI injection
- Main World script for React compatibility
- Token-by-token streaming display
- 7-day rule caching for offline use

Privacy and Security:
- Zero data collection or transmission
- Chrome's built-in Gemini Nano for processing
- Content Security Policy enforcement
- Comprehensive security audit passed

Technical:
- Built with Plasmo framework
- TypeScript for type safety
- Zod schema validation
- Hybrid rule loading architecture
```

---

## 2. Permissions Justification

### 2.1 Permissions Table

| Permission  | Justification                                                                                                            | User-Facing Benefit                                                                    | Privacy Impact                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `storage`   | Cache platform-specific optimization rules locally to enable offline operation and reduce network requests               | Works offline, faster load times, reduced bandwidth usage                              | **Low** - Only stores non-personal data (optimization rules as JSON text). No user-generated content stored. |
| `alarms`    | Schedule quarterly checks for updated optimization rules from GitHub Pages to keep strategies current                    | Always up-to-date with latest prompt engineering best practices without manual updates | **None** - No data collection. Only triggers periodic rule refresh check.                                    |
| `activeTab` | Detect which LLM platform (ChatGPT/Claude/Gemini) the user is currently on to apply platform-specific optimization rules | Tailored optimizations for each AI platform, better results                            | **Minimal** - Only reads current tab URL to detect platform. No content access.                              |

### 2.2 Host Permissions Table

| Host Permission               | Justification                                                                               | User-Facing Benefit                                   | Privacy Impact                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `https://chat.openai.com/*`   | Inject optimization widget into ChatGPT interface to enhance user prompts before submission | In-context prompt improvement without leaving ChatGPT | **Low** - Only accesses DOM to inject UI and read draft prompts on user action. Does not access chat history. |
| `https://chatgpt.com/*`       | Inject optimization widget into ChatGPT interface (alternate domain)                        | Same as above                                         | Same as above                                                                                                 |
| `https://claude.ai/*`         | Inject optimization widget into Claude interface to enhance user prompts before submission  | In-context prompt improvement without leaving Claude  | **Low** - Only accesses DOM to inject UI and read draft prompts on user action. Does not access chat history. |
| `https://bard.google.com/*`   | Inject optimization widget into Google Bard/Gemini interface (legacy domain)                | In-context prompt improvement without leaving Gemini  | **Low** - Only accesses DOM to inject UI and read draft prompts on user action. Does not access chat history. |
| `https://gemini.google.com/*` | Inject optimization widget into Google Gemini interface                                     | Same as above                                         | Same as above                                                                                                 |

---

## 3. Host Permissions Technical Justification

### 3.1 Why Host Permissions Are Required

The extension requires `host_permissions` for specific LLM platforms to:

#### 1. DOM Injection

Insert the optimization widget (icon) adjacent to the textarea where users compose prompts. This requires:

- Access to the page's DOM structure
- Ability to query for text input elements
- Shadow DOM creation for isolated UI

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

1. Inserting the widget UI (Shadow DOM, isolated)
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

---

## 4. Single Purpose Statement

### 4.1 Primary Purpose

**Prompt Tuner has a single, clearly defined purpose:**

> **Optimize user prompts for LLM chat interfaces using local AI processing.**

### 4.2 Feature Alignment

All features support this core function:

| Feature              | Purpose Alignment                                                  |
| -------------------- | ------------------------------------------------------------------ |
| Platform Detection   | Determines which LLM is active, applies correct optimization rules |
| Local AI Processing  | Processes prompts via Gemini Nano, generates optimized output      |
| UI Widget            | Provides user control, initiates optimization on demand            |
| Rule Updates         | Fetches latest strategies, keeps optimization current              |
| Streaming Display    | Shows tokens as generated, improves perceived performance          |
| Shadow DOM Injection | Isolates UI, prevents conflicts with host page                     |
| Main World Bridge    | Bypasses React Virtual DOM, ensures text replacement works         |

**Conclusion**: Every component serves the single purpose of prompt optimization.

### 4.3 What the Extension Does NOT Include

The extension intentionally excludes:

- User tracking or analytics
- Advertising or monetization features
- Social media integration
- Unrelated productivity tools
- Data collection or telemetry
- Third-party service integrations (beyond static rule hosting)

**Compliance**: Meets Chrome Web Store Single Purpose Policy.

---

## 5. Privacy Practices

### 5.1 Privacy Policy

**Full Policy URL**: [GitHub Pages URL]/docs/PRIVACY.html

**Summary**:

- No data collection
- No user tracking
- No external AI APIs
- All processing local (Chrome's Gemini Nano)
- Optimization rules fetched from GitHub Pages (static JSON)
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

---

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

---

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
- **Caption**: "Works seamlessly on Claude with XML structuring"
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

---

## 8. Developer Information

### 8.1 Developer Account

**Developer Name**: [Your Name/Organization]  
**Email**: [your-email@example.com]  
**Website**: [https://your-website.com]

### 8.2 Support Resources

**Support URL**: [GitHub Repository URL]  
**Support Email**: [support-email@example.com]

**Documentation**:

- User Guide: `docs/USER_GUIDE.md`
- FAQ: `docs/FAQ.md`
- Troubleshooting: `docs/TROUBLESHOOTING.md`

**Community**:

- GitHub Issues: For bug reports and feature requests
- GitHub Discussions: For questions and community support

### 8.3 Update Frequency

**Extension Updates**: As needed (bug fixes, security patches)  
**Rule Updates**: Quarterly (via GitHub Pages, no store submission required)

**Notification**: Users automatically receive updated rules without reinstalling.

---

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

---

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
- **Secure Communication**: HTTPS only (GitHub Pages) - PASS
- **No Vulnerabilities**: Security audit passed - PASS

### 10.3 Quality Guidelines

- **Functionality**: Works as described - PASS
- **User Experience**: Intuitive UI, clear feedback - PASS
- **Performance**: Lightweight, no slowdowns - PASS
- **Documentation**: Comprehensive docs provided - PASS
- **Support**: GitHub issues for support - PASS

---

## 11. Reviewer Notes

### 11.1 Testing Instructions

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
   - Verify NO network requests except:
     - Initial rule fetch from `*.github.io` (first use only)
   - Verify no analytics beacons
   - Verify no third-party API calls

7. **Verify Permissions**:
   - Extension only accesses specified hosts
   - No permission escalation prompts
   - Storage usage minimal (<1MB)

### 11.2 Common Issues and Solutions

**Issue**: "Gemini Nano not available" error  
**Solution**: Ensure Chrome 138+ and Gemini Nano installed at `chrome://components`

**Issue**: Widget doesn't appear  
**Solution**: Verify host_permissions granted for current site

**Issue**: Text replacement doesn't work  
**Solution**: Main World injector requires page reload after installation

### 11.3 Source Code Review

**Open Source Repository**: [GitHub URL]

**Key Files for Review**:

- `src/contents/prompt-tuner.tsx` - UI injection
- `src/lib/ai-engine.ts` - Local AI processing
- `src/lib/platform-rules.ts` - Rule fetching with validation
- `docs/SECURITY_AUDIT.md` - Security analysis
- `docs/PRIVACY.md` - Privacy policy

**Build Verification**:

```bash
git clone [repository]
cd prompt-tuner
npm install
npm run build
# Compare build/chrome-mv3-prod with submitted CRX
```

---

## 12. Post-Submission Checklist

### 12.1 After Approval

- Update GitHub README with Chrome Web Store link
- Create release tag (v0.1.0)
- Publish privacy policy to GitHub Pages
- Monitor initial user feedback
- Set up GitHub Issues templates
- Create CHANGELOG.md for public release

### 12.2 Marketing

- Social media announcement (Twitter, LinkedIn)
- Product Hunt submission
- Write blog post about local AI privacy
- Share on Reddit (r/chrome_extensions, r/ChatGPT)
- Submit to extension directories (alternativeto.net, etc.)

### 12.3 Monitoring

- Track Chrome Web Store reviews
- Monitor GitHub Issues for bugs
- Set up quarterly rule update schedule
- Plan next version features based on feedback

---

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
To cache platform-specific optimization rules locally, enabling offline operation
and reducing network requests. Only stores non-user data (JSON rule files).
```

**Why does your extension need 'alarms' permission?**

```
To schedule quarterly checks for updated optimization rules from GitHub Pages,
keeping the extension's strategies current without manual user updates.
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
No remote code is used. Optimization rules are static JSON data files (not executable code),
validated with Zod schemas before use, with bundled fallbacks.
```

---

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

**Date**: January 27, 2026  
**Signature**: [Developer Name]

---

**Document Version**: 1.0  
**Last Updated**: January 27, 2026  
**Status**: Ready for Chrome Web Store Submission
