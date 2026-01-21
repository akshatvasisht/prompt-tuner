/**
 * Type declarations for Chrome's window.ai (Gemini Nano) API
 * @see https://developer.chrome.com/docs/ai/built-in
 */

declare global {
  interface LanguageModelCapabilities {
    available: "readily" | "after-download" | "no"
    defaultTemperature?: number
    defaultTopK?: number
    maxTopK?: number
  }

  interface LanguageModelCreateOptions {
    systemPrompt?: string
    temperature?: number
    topK?: number
    signal?: AbortSignal
  }

  interface LanguageModel {
    prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>
    promptStreaming(input: string, options?: { signal?: AbortSignal }): ReadableStream<string>
    countPromptTokens(input: string): Promise<number>
    destroy(): void
  }

  interface LanguageModelAPI {
    capabilities(): Promise<LanguageModelCapabilities>
    create(options?: LanguageModelCreateOptions): Promise<LanguageModel>
  }

  interface WindowAI {
    languageModel?: LanguageModelAPI
  }

  interface Window {
    ai?: WindowAI
  }

  // Also declare on globalThis for service worker context
  var ai: WindowAI | undefined
}

export {}
