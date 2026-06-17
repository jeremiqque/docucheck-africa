import OpenAI from "openai";

/**
 * Groq is OpenAI-API compatible, so we reuse the OpenAI SDK with a different
 * base URL + key. Model IDs are env-overridable because Groq's catalogue
 * changes often - set GROQ_VISION_MODEL / GROQ_TEXT_MODEL to override.
 */
export const llm = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
});

export const VISION_MODEL =
  process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

export const TEXT_MODEL =
  process.env.GROQ_TEXT_MODEL || "llama-3.3-70b-versatile";
