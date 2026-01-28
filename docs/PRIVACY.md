# Privacy Policy

**Effective Date**: January 27, 2026  
**Last Updated**: January 27, 2026  
**Extension**: Prompt Tuner  
**Version**: 0.1.0

---

## Overview

Prompt Tuner is a privacy-first Chrome extension that optimizes your prompts for ChatGPT, Claude, and Google Gemini using local AI processing only. We are committed to protecting your privacy and ensuring complete transparency about how the extension works.

**Our Core Privacy Promise:**

> **No data leaves your device. Period.**

All prompt optimization happens locally in your browser using Chrome's built-in Gemini Nano AI model. We do not collect, store, transmit, or sell any user data.

---

## 1. Data Collection

### 1.1 What Data We DO NOT Collect

Prompt Tuner does not collect:

- Your prompts or chat messages
- Personal information (name, email, location, etc.)
- Browsing history or website visits
- Usage analytics or telemetry
- Device information or identifiers
- IP addresses or network data
- User accounts or login credentials

### 1.2 What Data We DO Process (Locally Only)

The extension processes the following data locally on your device:

**User Prompts**:

- When you click the optimization icon, your draft prompt is sent to Chrome's built-in Gemini Nano AI model
- Processing happens entirely within your browser's local AI engine
- The optimized prompt is displayed in the extension UI
- None of this data is transmitted over the network or stored permanently

**Optimization Rules**:

- The extension fetches platform-specific optimization rules (JSON files) from GitHub Pages on first use
- These rules are cached locally in `chrome.storage.local` for 7 days
- Rules are static text data (not user-generated content)
- This is the only network request the extension makes

---

## 2. Local AI Processing

### 2.1 Chrome Built-In AI (Gemini Nano)

Prompt Tuner uses Chrome's built-in Gemini Nano AI model, which:

- Runs entirely on your device (no cloud connection)
- Requires Chrome 138 or later with Gemini Nano enabled
- Processes prompts locally without sending data to Google or any server
- Is managed by Chrome's privacy and security policies

**How to verify**:

1. Navigate to `chrome://components`
2. Look for "Optimization Guide On Device Model" (Gemini Nano)
3. Verify it shows "Ready for use" status

### 2.2 No External AI Services

The extension does not use:

- OpenAI API
- Anthropic API
- Google Cloud AI APIs
- Any third-party AI services

All AI capabilities come from Chrome's local engine.

---

## 3. Data Storage

### 3.1 Local Storage Only

The extension uses `chrome.storage.local` to store:

**Cached Optimization Rules**:

- Platform-specific optimization rules (fetched from GitHub Pages)
- Cached for 7 days to reduce network requests
- Stored locally in your browser
- Contains no user data or personal information

**Session State** (if applicable):

- UI preferences (widget visibility, etc.)
- No prompts or chat content is ever stored

### 3.2 Data Retention

- **User prompts**: Not stored (processed in memory only)
- **Optimization rules**: Cached for 7 days, then refreshed
- **Session state**: Cleared when extension is uninstalled

### 3.3 Data Deletion

You can clear all locally stored data:

1. Right-click the extension icon and select "Manage Extension"
2. Click "Remove" to uninstall
3. All cached data is permanently deleted

Or clear storage manually:

1. Open DevTools (F12) on any page
2. Go to Application, then Storage, and clear site data for the extension

---

## 4. Network Activity

### 4.1 Rule Updates (GitHub Pages)

The extension makes one type of network request:

**What**: Fetch optimization rules (JSON files)  
**From**: `https://*.github.io` or `https://*.githubusercontent.com`  
**When**: On first use and every 7 days (automatic refresh)  
**Data Sent**: None (simple HTTP GET request)  
**Data Received**: Platform-specific optimization rules (JSON text)

**Example URL**: `https://yourusername.github.io/prompt-tuner/rules/openai.json`

**Why this is safe**:

- Rules are static JSON files (no executable code)
- Validated with Zod schemas before use
- Fallback to bundled rules if fetch fails
- No user data is included in the request

### 4.2 No Tracking or Analytics

The extension does not:

- Send usage data to any server
- Use Google Analytics or similar tools
- Track user behavior or interactions
- Include advertising SDKs or trackers
- Report crashes or errors externally

### 4.3 Content Security Policy (CSP)

Our CSP restricts network activity to:

```
connect-src 'self' https://*.github.io https://*.githubusercontent.com
```

This means:

- Only extension resources and GitHub Pages can be accessed
- All other network requests are blocked by the browser
- No external scripts or APIs can be loaded

---

## 5. Permissions Justification

The extension requests the following Chrome permissions:

### 5.1 Required Permissions

**`storage`**:

- **Purpose**: Cache optimization rules locally
- **User Benefit**: Offline capability, faster load times
- **Data Stored**: Platform rules (JSON), UI preferences
- **Privacy Impact**: Low (no personal data)

**`alarms`**:

- **Purpose**: Schedule periodic rule update checks (every 7 days)
- **User Benefit**: Always up-to-date optimization strategies
- **Privacy Impact**: None (no data collection)

**`activeTab`**:

- **Purpose**: Detect which LLM platform (ChatGPT/Claude/Gemini) you're on
- **User Benefit**: Apply platform-specific optimization rules
- **Privacy Impact**: Low (only domain detection, no content access)

### 5.2 Host Permissions

**`https://chat.openai.com/*`**  
**`https://chatgpt.com/*`**  
**`https://claude.ai/*`**  
**`https://bard.google.com/*`**  
**`https://gemini.google.com/*`**

- **Purpose**: Inject optimization widget into chat interface
- **What We Access**: DOM structure to add UI elements and detect text inputs
- **What We DO NOT Access**: Your existing chat history or messages
- **User Benefit**: In-context prompt optimization without leaving the chat

**Technical Details**:

- Widget injected via Shadow DOM (isolated from page)
- Only reads your current draft prompt when you click the optimize button
- Text replacement happens locally (no network transmission)
- Page content is never transmitted or stored

---

## 6. Third-Party Services

### 6.1 GitHub Pages (Static Hosting)

- **Used for**: Hosting optimization rule files (JSON)
- **Data Shared**: None (anonymous HTTP GET request)
- **Privacy Policy**: https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement

### 6.2 No Other Third Parties

The extension does not integrate with:

- Advertising networks
- Analytics platforms (Google Analytics, etc.)
- Social media services
- Payment processors
- User authentication services

---

## 7. Open Source Transparency

### 7.1 Source Code

Prompt Tuner is open source under the MIT License:

- Full source code available on GitHub
- All data flows are auditable
- Community can verify privacy claims
- Security researchers welcome to review

**Repository**: [GitHub URL]  
**License**: MIT (see LICENSE file)

### 7.2 Build Reproducibility

You can build the extension from source to verify:

1. Clone the repository
2. Run `npm install && npm run build`
3. Compare with published extension

---

## 8. Children's Privacy

Prompt Tuner does not knowingly collect data from anyone, including children under 13. Since no data is collected at all, there are no age restrictions on usage.

However, the extension's purpose (optimizing prompts for AI chat platforms) assumes users are using third-party AI services, which may have their own age restrictions.

---

## 9. Changes to This Privacy Policy

We may update this privacy policy to reflect:

- Changes to Chrome extension policies
- New features (always privacy-preserving)
- User feedback and clarifications

**Notification**:

- Updated policy will be published at this URL
- Effective date updated at the top of this document
- Material changes announced via extension update notes

**Your Rights**:

- You may review the policy at any time
- You may uninstall the extension if you disagree with updates

---

## 10. User Rights and Control

### 10.1 Your Rights

You have the right to:

- Know what data is collected (none)
- Access your data (only cached rules, no personal data)
- Delete your data (uninstall extension)
- Opt-out (disable or uninstall extension)
- Review source code (open source)

### 10.2 Data Portability

Since no user data is collected:

- There is no data to export
- There are no user accounts to delete
- Uninstalling the extension removes all cached data

### 10.3 Do Not Track

The extension respects Do Not Track (DNT) signals, though they are not applicable since:

- No tracking occurs regardless of DNT setting
- No analytics or cookies are used
- Privacy is the default (no opt-out needed)

---

## 11. Security

### 11.1 Data Security

Since all processing is local:

- No data transmission equals no interception risk
- Chrome's sandbox protects extension from other sites
- Shadow DOM isolates extension UI from page scripts

### 11.2 Vulnerability Reporting

If you discover a security vulnerability:

- **Email**: [your-security-email@example.com]
- **GitHub**: Open a private security advisory
- **Response Time**: We aim to respond within 48 hours

We follow responsible disclosure practices and appreciate security research.

---

## 12. Compliance

### 12.1 Chrome Web Store Policies

This extension complies with:

- **Single Purpose Policy**: One purpose (prompt optimization)
- **Limited Use Policy**: Minimal permissions, no data exfiltration
- **User Data Privacy**: No collection, transmission, or sale of user data
- **Content Security Policy**: Restrictive CSP prevents code injection

### 12.2 Data Protection Regulations

**GDPR (European Union)**:

- Not applicable (no personal data collected)
- No data controllers or processors
- No cross-border data transfers

**CCPA (California)**:

- Not applicable (no personal information collected or sold)
- No opt-out mechanism needed (privacy by default)

**Other Jurisdictions**:

- Local-only processing complies with all major privacy regulations
- No data residency concerns (data never leaves device)

---

## 13. Contact Information

### 13.1 Privacy Questions

For privacy-related questions:

- **Email**: [your-email@example.com]
- **GitHub Issues**: [repository-url]/issues
- **Response Time**: 5-7 business days

### 13.2 Extension Support

For technical support:

- **GitHub Issues**: [repository-url]/issues
- **Documentation**: [repository-url]/docs

---

## 14. Summary

**What Prompt Tuner Does**:

- Optimizes your prompts locally using Chrome's built-in AI
- Fetches optimization rules from GitHub Pages (static JSON)
- Caches rules locally for offline use

**What Prompt Tuner Does NOT Do**:

- Collect, store, or transmit your prompts
- Use external AI APIs or cloud services
- Track your usage or behavior
- Sell or share any data
- Store personal information

**Bottom Line**:
Your privacy is fully protected. All processing happens on your device, and no data ever leaves your browser.

---

## 15. Legal

This privacy policy is effective as of the date listed above. By installing and using Prompt Tuner, you acknowledge that you have read and understood this policy.

**Governing Law**: [Your Jurisdiction]  
**Dispute Resolution**: [Your Preferred Method]

---

**Last Updated**: January 27, 2026  
**Privacy Policy Version**: 1.0  
**Extension Version**: 0.1.0

For the latest version of this policy, visit: [GitHub Pages URL]/PRIVACY.html
