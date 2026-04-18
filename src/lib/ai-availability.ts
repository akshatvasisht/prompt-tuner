import { type AIAvailability } from "~types";
import { logger } from "~lib/logger";

const CHROME_VERSION_INFO = "Requires Chrome 138+ with Gemini Nano enabled";

export function isLanguageModelAvailable(): boolean {
  return typeof LanguageModel !== "undefined";
}

export async function checkAIAvailability(): Promise<AIAvailability> {
  if (!isLanguageModelAvailable()) {
    return {
      available: false,
      reason: `LanguageModel API not available. ${CHROME_VERSION_INFO}`,
    };
  }

  try {
    const availability = await LanguageModel.availability({
      expectedOutputs: [{ type: "text", languages: ["en"] }],
    });

    switch (availability) {
      case "available":
        return { available: true };

      case "downloadable":
        return {
          available: false,
          needsDownload: true,
          reason:
            "Gemini Nano model can be downloaded. Visit chrome://components to trigger download.",
        };

      case "downloading":
        return {
          available: false,
          needsDownload: true,
          reason: "Gemini Nano model is currently downloading. Please wait.",
        };

      case "unavailable":
      default:
        return {
          available: false,
          reason:
            "Gemini Nano is not supported on this device or browser configuration.",
        };
    }
  } catch (error) {
    logger.error("AI availability check failed", error);
    return {
      available: false,
      reason:
        error instanceof Error
          ? error.message
          : "Failed to check AI availability",
    };
  }
}
