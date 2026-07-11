// Normalized error shape the frontend maps to fallback UI
export type ErrorType = "offline" | "rate_limited" | "timeout" | "ai_error" | "unknown";

export interface NormalizedError {
  error: { type: ErrorType; message: string };
}

// CORS headers must be included on error responses for cross-origin clients.
// Without them the browser swallows the body and the client sees an opaque network failure.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof Error) {
    const msg = err.message;
    const lower = msg.toLowerCase();

    // AI-provider-structured errors (from callGemini — covers both Groq and OpenRouter)
    // Prefix-based checks handle GEMINI_* and GROQ_* error labels.

    if (msg.startsWith("GEMINI_RATE_LIMITED") || msg.startsWith("GROQ_RATE_LIMITED") || lower.includes("429") || lower.includes("rate limit") || lower.includes("quota")) {
      return { error: { type: "rate_limited", message: msg } };
    }
    if (msg.startsWith("GEMINI_TIMEOUT") || msg.startsWith("GROQ_TIMEOUT") || lower.includes("timeout") || lower.includes("timed out") || lower.includes("aborted")) {
      return { error: { type: "timeout", message: msg } };
    }
    if (msg.startsWith("GEMINI_FETCH_ERROR") || msg.startsWith("GROQ_FETCH_ERROR") || lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("econnrefused")) {
      return { error: { type: "offline", message: msg } };
    }
    if (msg.startsWith("GEMINI_") || msg.startsWith("GROQ_") || msg.startsWith("AI_")) {
      // Any other AI provider error (safety block, auth, envelope parse, HTTP error, missing key)
      return { error: { type: "ai_error", message: msg } };
    }

    // Generic fallbacks
    if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("econnrefused")) {
      return { error: { type: "offline", message: msg } };
    }
    return { error: { type: "unknown", message: msg } };
  }
  return { error: { type: "unknown", message: String(err) } };
}

export function errorResponse(err: unknown, status = 500): Response {
  const body = normalizeError(err);
  // Log every server-side error for debuggability in edge runtime logs
  console.error("[errorResponse]", body.error.type, body.error.message);
  return new Response(JSON.stringify(body), {
    status,
    headers: CORS_HEADERS,
  });
}
