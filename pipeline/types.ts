/**
 * Type definitions for the pipeline scripts
 */

export interface DocumentationSource {
  url: string;
  platform: "openai" | "anthropic" | "google";
  title: string;
  description?: string;
}

export interface ScrapedContent {
  url: string;
  platform: "openai" | "anthropic" | "google";
  title: string;
  content: string;
  scrapedAt: string;
  metadata?: Record<string, unknown>;
}

export interface OptimizationRule {
  id: string;
  platform: "openai" | "anthropic" | "google" | "general";
  title: string;
  description: string;
  rule: string;
  examples?: string[];
  tags?: string[];
  source?: string;
  createdAt: string;
}

export interface DistillationConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
}
