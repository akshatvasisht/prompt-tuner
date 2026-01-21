/**
 * Distillation pipeline using Gemini Flash
 * Converts scraped documentation into optimization rules
 */

import { readFile, writeFile, readdir, mkdir } from "fs/promises";
import { join } from "path";
import {
  type ScrapedContent,
  type OptimizationRule,
  type GeminiResponse,
} from "./types.js";

const GEMINI_MODEL = "gemini-1.5-flash";

const SYSTEM_PROMPT = `You are an expert prompt engineer. Your task is to extract actionable prompt optimization rules from documentation.

For each rule, provide:
1. A clear, concise title (3-6 words)
2. A description of what the rule does (1 sentence)
3. The rule itself as a specific, actionable instruction (1-2 sentences)
4. 2-3 relevant tags

Return a JSON array with this exact structure:
[
  {
    "title": "Rule Title",
    "description": "Brief description of the rule",
    "rule": "The actionable instruction to follow",
    "tags": ["tag1", "tag2"]
  }
]

Extract 5-8 of the most important, actionable rules. Focus on rules that are:
- Specific and practical
- Platform-specific (when applicable)
- Backed by the documentation
- Easy to apply to any prompt

Return ONLY the JSON array, no other text.`;

/**
 * Distill scraped content into optimization rules using Gemini
 */
async function distillContent(
  scraped: ScrapedContent,
): Promise<OptimizationRule[]> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }

  // Truncate content if too long (Gemini has context limits)
  const maxContentLength = 30000;
  const truncatedContent =
    scraped.content.length > maxContentLength
      ? scraped.content.slice(0, maxContentLength) +
        "\n\n[Content truncated...]"
      : scraped.content;

  const prompt = `${SYSTEM_PROMPT}

---

Documentation Title: ${scraped.title}
Platform: ${scraped.platform}

Documentation Content:
${truncatedContent}

---

Extract the optimization rules from this documentation:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4000,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API error: ${String(response.status)} ${errorText}`,
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No content in Gemini response");
    }

    // Extract JSON from response (may be wrapped in markdown code blocks)
    let jsonText = text;
    const jsonMatch = /```(?:json)?\s*([\s\S]*?)\s*```/.exec(text);
    if (jsonMatch?.[1]) {
      jsonText = jsonMatch[1];
    }

    // Try to find JSON array if not in code block
    if (!jsonText.startsWith("[")) {
      const arrayMatch = /\[[\s\S]*\]/.exec(text);
      if (arrayMatch) {
        jsonText = arrayMatch[0];
      }
    }

    const parsedRules = JSON.parse(jsonText) as {
      title: string;
      description: string;
      rule: string;
      tags?: string[];
    }[];

    // Add metadata to each rule
    return parsedRules.map((rule, idx) => ({
      id: `${scraped.platform}-${String(Date.now())}-${String(idx)}`,
      platform: scraped.platform,
      title: rule.title,
      description: rule.description,
      rule: rule.rule,
      tags: rule.tags ?? [],
      source: scraped.url,
      createdAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error(`Error distilling content from ${scraped.url}:`, error);
    return [];
  }
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main distillation function
 */
async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log("Starting rule distillation pipeline...");

  const scrapedDir = join(process.cwd(), "rules", "scraped");
  const rulesDir = join(process.cwd(), "rules");

  // Ensure rules directory exists
  await mkdir(rulesDir, { recursive: true });

  try {
    const files = await readdir(scrapedDir);
    const jsonFiles = files.filter(
      (f) => f.endsWith(".json") && f !== "summary.json",
    );

    if (jsonFiles.length === 0) {
      // eslint-disable-next-line no-console
      console.log(
        "No scraped content found. Run `npm run pipeline:scrape` first.",
      );
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`Found ${String(jsonFiles.length)} scraped files to process\n`);

    const allRules: Record<string, OptimizationRule[]> = {
      openai: [],
      anthropic: [],
      google: [],
    };

    for (const file of jsonFiles) {
      const filePath = join(scrapedDir, file);
      const content = await readFile(filePath, "utf-8");
      const scraped = JSON.parse(content) as ScrapedContent;

      // eslint-disable-next-line no-console
      console.log(`[${scraped.platform}] Distilling ${scraped.title}...`);

      const rules = await distillContent(scraped);

      if (rules.length > 0) {
        allRules[scraped.platform] ??= [];
        allRules[scraped.platform]?.push(...rules);
        // eslint-disable-next-line no-console
        console.log(`  [OK] Extracted ${String(rules.length)} rules`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`  [FAIL] No rules extracted`);
      }

      // Rate limiting - wait 3 seconds between API calls
      await delay(3000);
    }

    // Save rules to platform-specific files
    // eslint-disable-next-line no-console
    console.log(`\n${"=".repeat(50)}`);
    // eslint-disable-next-line no-console
    console.log("Saving rules to files...\n");

    for (const [platform, rules] of Object.entries(allRules)) {
      if (rules.length > 0) {
        const outputPath = join(rulesDir, `${platform}.json`);
        await writeFile(outputPath, JSON.stringify(rules, null, 2));
        // eslint-disable-next-line no-console
        console.log(
          `  [OK] Saved ${String(rules.length)} rules to ${platform}.json`,
        );
      }
    }

    const totalRules = Object.values(allRules).reduce(
      (sum, rules) => sum + rules.length,
      0,
    );
    // eslint-disable-next-line no-console
    console.log(`\nDistillation complete! Total rules: ${String(totalRules)}`);
  } catch (error) {
    console.error("Error in distillation pipeline:", error);
    process.exit(1);
  }
}

// Run if executed directly
main().catch((error: unknown) => {
  console.error("Pipeline failed:", error);
  process.exit(1);
});
