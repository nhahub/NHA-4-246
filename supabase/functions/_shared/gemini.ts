// Gemini API client (server-side only — key never leaves the edge function)
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_BASE    = "https://generativelanguage.googleapis.com/v1beta";
const MODEL          = "gemini-1.5-flash";

export interface GeminiResponse {
  candidates: { content: { parts: { text: string }[] } }[];
}

export async function callGemini(
  prompt: string,
  opts: { timeoutMs?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const { timeoutMs = 30_000, jsonMode = false } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };

  if (jsonMode) {
    body.generationConfig = { responseMimeType: "application/json" };
  }

  let res: Response;
  try {
    res = await fetch(
      `${GEMINI_BASE}/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
  clearTimeout(timer);

  if (res.status === 429) throw new Error("429 rate limited by Gemini");
  if (!res.ok) {
    const text = await res.text();
    // Propagate content-safety rejections with a recognisable marker
    if (res.status === 400 && text.includes("SAFETY")) {
      throw new Error("GEMINI_SAFETY_BLOCK: " + text);
    }
    throw new Error(`Gemini HTTP ${res.status}: ${text}`);
  }

  const data: GeminiResponse = await res.json();
  return data.candidates[0]?.content?.parts[0]?.text ?? "";
}

export function isSafetyBlock(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith("GEMINI_SAFETY_BLOCK");
}
