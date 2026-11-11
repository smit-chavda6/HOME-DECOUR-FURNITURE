import "server-only";

/**
 * Thin wrapper around the Google Gemini REST API, used by the shopping
 * assistant and the room advisor. The key stays on the server.
 */
const FALLBACK_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];

export type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

export type GeminiMessage = { role: "user" | "model"; parts: GeminiPart[] };

type GeminiOptions = {
  system: string;
  messages: GeminiMessage[];
  /** Ask for a JSON reply that follows this schema. */
  jsonSchema?: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
};

export function isGeminiEnabled() {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Returns the model's text reply, or null when every model failed. */
export async function askGemini(options: GeminiOptions): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const preferred = process.env.GEMINI_MODEL;
  const models = [...new Set([preferred, ...FALLBACK_MODELS].filter(Boolean))] as string[];

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: options.system }] },
    contents: options.messages,
    generationConfig: {
      temperature: options.temperature ?? 0.6,
      maxOutputTokens: options.maxOutputTokens ?? 1024,
      ...(options.jsonSchema
        ? { responseMimeType: "application/json", responseSchema: options.jsonSchema }
        : {}),
    },
  });

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          // The key travels in a header, not the URL, so it never lands in logs.
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body,
          signal: AbortSignal.timeout(25_000),
        },
      );
      if (!response.ok) {
        console.warn(`Gemini model ${model} answered ${response.status}; trying the next one.`);
        continue;
      }
      const data = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();
      if (text) return text;
    } catch (error) {
      console.warn(`Gemini model ${model} failed.`, error);
    }
  }
  return null;
}
