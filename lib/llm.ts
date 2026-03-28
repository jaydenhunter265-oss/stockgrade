import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText, Output, type ModelMessage } from "ai";
import { z } from "zod";

const provider = createOpenAI({
  apiKey: process.env.LLM_API_KEY!,
  baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
});

export const model = provider(process.env.LLM_MODEL_NAME || "gpt-4o-mini");

/** Fire a typed JSON-returning LLM call via Output.object */
export async function llmJson<T>(
  messages: ModelMessage[],
  schema: z.ZodType<T>,
  opts?: { temperature?: number; maxOutputTokens?: number }
): Promise<T> {
  const result = await generateText({
    model,
    messages,
    temperature: opts?.temperature ?? 0.3,
    maxOutputTokens: opts?.maxOutputTokens ?? 4096,
    output: Output.object({ schema }),
  });
  return result.output as T;
}

/** Fire a plain-text LLM call */
export async function llmText(
  messages: ModelMessage[],
  opts?: { temperature?: number; maxOutputTokens?: number }
): Promise<string> {
  const { text } = await generateText({
    model,
    messages,
    temperature: opts?.temperature ?? 0.7,
    maxOutputTokens: opts?.maxOutputTokens ?? 4096,
  });
  return text;
}

/** Stream a plain-text LLM response */
export function llmStream(messages: ModelMessage[]) {
  return streamText({ model, messages });
}

export type { ModelMessage };
export { generateText, streamText, Output };
