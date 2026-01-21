/**
 * Scraping pipeline using Jina Reader
 * Fetches and processes documentation from LLM providers
 */

import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { type DocumentationSource, type ScrapedContent } from "./types.js"

const DOCUMENTATION_SOURCES: DocumentationSource[] = [
  {
    url: "https://platform.openai.com/docs/guides/prompt-engineering",
    platform: "openai",
    title: "OpenAI Prompt Engineering Guide",
    description: "Official OpenAI prompt engineering documentation",
  },
  {
    url: "https://docs.anthropic.com/claude/docs/prompt-engineering",
    platform: "anthropic",
    title: "Anthropic Prompt Engineering Guide",
    description: "Official Anthropic prompt engineering documentation",
  },
  {
    url: "https://ai.google.dev/docs/prompt_best_practices",
    platform: "google",
    title: "Google AI Prompt Best Practices",
    description: "Official Google AI prompt engineering documentation",
  },
]

/**
 * Scrape content from a URL using Jina Reader API
 */
async function scrapeUrl(source: DocumentationSource): Promise<ScrapedContent | null> {
  const jinaApiKey = process.env.JINA_API_KEY

  if (!jinaApiKey) {
    console.warn("JINA_API_KEY not set, using public endpoint (rate limited)")
  }

  try {
    const headers: Record<string, string> = {
      "X-Return-Format": "markdown",
    }

    if (jinaApiKey) {
      headers.Authorization = `Bearer ${jinaApiKey}`
    }

    const response = await fetch(`https://r.jina.ai/${source.url}`, { headers })

    if (!response.ok) {
      throw new Error(`Failed to scrape ${source.url}: ${String(response.status)} ${response.statusText}`)
    }

    const content = await response.text()

    if (!content || content.length < 100) {
      throw new Error(`Scraped content too short for ${source.url}`)
    }

    return {
      url: source.url,
      platform: source.platform,
      title: source.title,
      content,
      scrapedAt: new Date().toISOString(),
      metadata: {
        source: source.description,
        contentLength: content.length,
      },
    }
  } catch (error) {
    console.error(`Error scraping ${source.url}:`, error)
    return null
  }
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Main scraping function
 */
async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log("Starting documentation scraping pipeline...")
  // eslint-disable-next-line no-console
  console.log(`Sources to scrape: ${String(DOCUMENTATION_SOURCES.length)}\n`)

  const results: ScrapedContent[] = []
  const outputDir = join(process.cwd(), "rules", "scraped")

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true })

  for (const source of DOCUMENTATION_SOURCES) {
    // eslint-disable-next-line no-console
    console.log(`[${source.platform}] Scraping ${source.title}...`)

    const scraped = await scrapeUrl(source)

    if (scraped) {
      results.push(scraped)

      // Save individual scraped content
      const filename = `${source.platform}-${String(Date.now())}.json`
      const filepath = join(outputDir, filename)
      await writeFile(filepath, JSON.stringify(scraped, null, 2))

      // eslint-disable-next-line no-console
      console.log(`  [OK] Scraped ${String(scraped.content.length)} characters`)
      // eslint-disable-next-line no-console
      console.log(`  [OK] Saved to ${filename}`)
    } else {
      // eslint-disable-next-line no-console
      console.log(`  [FAIL] Failed to scrape ${source.title}`)
    }

    // Rate limiting - wait 2 seconds between requests
    await delay(2000)
  }

  // Save summary file
  const summaryPath = join(outputDir, "summary.json")
  await writeFile(
    summaryPath,
    JSON.stringify(
      {
        scrapedAt: new Date().toISOString(),
        totalSources: DOCUMENTATION_SOURCES.length,
        successfulScrapes: results.length,
        sources: results.map(r => ({
          platform: r.platform,
          title: r.title,
          url: r.url,
        contentLength: r.content.length,
      })),
    },
    null,
    2
  )
)

  // eslint-disable-next-line no-console
  console.log(`\n${"=".repeat(50)}`)
  // eslint-disable-next-line no-console
  console.log(`Scraping complete!`)
  // eslint-disable-next-line no-console
  console.log(`  Total sources: ${String(DOCUMENTATION_SOURCES.length)}`)
  // eslint-disable-next-line no-console
  console.log(`  Successful: ${String(results.length)}`)
  // eslint-disable-next-line no-console
  console.log(`  Failed: ${String(DOCUMENTATION_SOURCES.length - results.length)}`)
  // eslint-disable-next-line no-console
  console.log(`  Output directory: ${outputDir}`)
}

// Run if executed directly
main().catch((error: unknown) => {
  console.error("Pipeline failed:", error)
  process.exit(1)
})
