/**
 * Scraping pipeline using Playwright + Readability + Turndown
 * Fetches and processes documentation from LLM providers
 */

import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { chromium, type Browser } from "@playwright/test"
import { Readability } from "@mozilla/readability"
import { JSDOM } from "jsdom"
import TurndownService from "turndown"
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

const PLAYWRIGHT_TIMEOUT = 30000 // 30 seconds

/**
 * Initialize Turndown service for HTML to Markdown conversion
 */
function createTurndownService(): TurndownService {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
  })
  
  // Preserve code blocks
  turndown.keep(["pre", "code"])
  
  return turndown
}

/**
 * Extract content using Mozilla Readability
 */
function extractContent(html: string, url: string): string | null {
  try {
    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()
    
    if (!article) {
      return null
    }
    
    // Convert extracted HTML to Markdown
    const turndown = createTurndownService()
    const markdown = turndown.turndown(article.content)
    
    return markdown
  } catch (error) {
    console.error("Error extracting content with Readability:", error)
    return null
  }
}

/**
 * Scrape content using Playwright (primary method)
 */
async function scrapeWithPlaywright(url: string): Promise<string | null> {
  let browser: Browser | null = null
  
  try {
    // eslint-disable-next-line no-console
    console.log("  [Playwright] Launching browser...")
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    })
    const page = await context.newPage()
    
    // Navigate to page with timeout
    // eslint-disable-next-line no-console
    console.log("  [Playwright] Navigating to URL...")
    await page.goto(url, { 
      waitUntil: "networkidle",
      timeout: PLAYWRIGHT_TIMEOUT,
    })
    
    // Get full HTML content
    const html = await page.content()
    
    await browser.close()
    browser = null
    
    // Extract content using Readability
    // eslint-disable-next-line no-console
    console.log("  [Readability] Extracting content...")
    const markdown = extractContent(html, url)
    
    return markdown
  } catch (error) {
    console.error("  [Playwright] Error:", error)
    if (browser) {
      await browser.close().catch(() => {})
    }
    return null
  }
}

/**
 * Scrape content using simple fetch (fallback method)
 */
async function scrapeWithFetch(url: string): Promise<string | null> {
  try {
    // eslint-disable-next-line no-console
    console.log("  [Fetch] Fetching URL...")
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${String(response.status)}: ${response.statusText}`)
    }
    
    const html = await response.text()
    
    // Extract content using Readability
    // eslint-disable-next-line no-console
    console.log("  [Readability] Extracting content...")
    const markdown = extractContent(html, url)
    
    return markdown
  } catch (error) {
    console.error("  [Fetch] Error:", error)
    return null
  }
}

/**
 * Scrape content from a URL using Playwright + Readability + Turndown
 * Falls back to fetch if Playwright fails
 */
async function scrapeUrl(source: DocumentationSource): Promise<ScrapedContent | null> {
  try {
    // Try Playwright first (handles JavaScript-heavy pages)
    let content = await scrapeWithPlaywright(source.url)
    
    // Fall back to fetch if Playwright fails
    if (!content) {
      // eslint-disable-next-line no-console
      console.log("  [Fallback] Trying fetch method...")
      content = await scrapeWithFetch(source.url)
    }
    
    if (!content || content.length < 100) {
      throw new Error(`Scraped content too short for ${source.url}`)
    }
    
    // eslint-disable-next-line no-console
    console.log(`  [OK] Extracted ${String(content.length)} characters`)
    
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
