# Environment Setup Instructions

## Prerequisites

### Browser Requirements

| Requirement | Minimum |
|-------------|---------|
| **Chrome Version** | 138 or higher |
| **Operating System** | Windows 10/11, macOS 13+, or Linux (Desktop only) |
| **Free Storage** | 22 GB (for Gemini Nano model download) |
| **GPU VRAM** | > 4 GB |
| **OR CPU/RAM** | 16 GB RAM with 4+ CPU cores |
| **Network** | Unmetered connection (for initial model download) |

**Not Supported:** Android, iOS, ChromeOS (non-Plus devices)

### Development Tools

* Node.js 18+ (LTS recommended)
* npm 9+ or pnpm

## Installation

### 1. Clone & Install

```bash
git clone https://github.com/username/prompt-tuner.git
cd prompt-tuner
npm install
```

### 2. Enable Chrome Built-in AI

Before the extension can work, you need to enable Gemini Nano in Chrome:

#### Step 1: Enable Chrome Flags

Open Chrome and navigate to:

```
chrome://flags/#optimization-guide-on-device-model
```

Set **"Optimization Guide On Device Model"** to **Enabled BypassPerfRequirement**

Then navigate to:

```
chrome://flags/#prompt-api-for-gemini-nano
```

Set **"Prompt API for Gemini Nano"** to **Enabled**

**Restart Chrome** after changing these flags.

#### Step 2: Download Gemini Nano Model

1. Open `chrome://components/`
2. Find **"Optimization Guide On Device Model"**
3. Click **"Check for update"** to trigger the model download
4. Wait for the download to complete (this may take several minutes)

#### Step 3: Verify Installation

Open Chrome DevTools console and run:

```javascript
await LanguageModel.availability()
// Should return: "available"
```

If it returns `"downloadable"` or `"downloading"`, wait for the model download to complete.

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts Plasmo in development mode with hot-reload.

Load the extension in Chrome:
1. Open `chrome://extensions/`
2. Enable **"Developer mode"** (top right)
3. Click **"Load unpacked"**
4. Select the `build/chrome-mv3-dev` folder

### Production Build

```bash
npm run build
```

The production build will be in `build/chrome-mv3-prod`.

### Package for Distribution

```bash
npm run package
```

Creates a `.zip` file ready for Chrome Web Store submission.

## Testing

```bash
# Run unit tests
npm test

# Run tests with UI
npm run test:ui

# Run end-to-end tests
npm run test:e2e
```

## Troubleshooting

### Issue: "LanguageModel is not defined"

**Cause:** Chrome Built-in AI is not enabled or Chrome version is too old.

**Fix:**
1. Update Chrome to version 138 or higher
2. Enable the required flags (see Step 1 above)
3. Restart Chrome completely

### Issue: "unavailable" status from LanguageModel.availability()

**Cause:** Hardware doesn't meet minimum requirements.

**Fix:**
- Ensure you have > 4 GB GPU VRAM, or 16 GB RAM with 4+ CPU cores
- Check that you have at least 22 GB free disk space
- Try on a different device that meets requirements

### Issue: Model download not starting

**Cause:** Network restrictions or storage issues.

**Fix:**
1. Ensure unmetered/unlimited network connection
2. Free up disk space (need 22 GB minimum)
3. Try manually triggering download at `chrome://components/`

### Issue: Extension not appearing on LLM sites

**Cause:** Extension not loaded or host permissions issue.

**Fix:**
1. Verify extension is enabled at `chrome://extensions/`
2. Reload the extension
3. Hard refresh the LLM site (Ctrl+Shift+R)

---

For more information, see:
- [Chrome Built-in AI Documentation](https://developer.chrome.com/docs/extensions/ai/prompt-api)
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design details
- [TESTING.md](docs/TESTING.md) - Testing guidelines
