// Normalized error shape the frontend maps to fallback UI
export type ErrorType = "offline" | "rate_limited" | "timeout" | "unknown";

export interface NormalizedError {
  error: { type: ErrorType; message: string };
}

export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("econnrefused")) {
      return { error: { type: "offline", message: err.message } };
    }
    if (msg.includes("429") || msg.includes("rate limit") || msg.includes("quota")) {
      return { error: { type: "rate_limited", message: err.message } };
    }
    if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("aborted")) {
      return { error: { type: "timeout", message: err.message } };
    }
    return { error: { type: "unknown", message: err.message } };
  }
  return { error: { type: "unknown", message: String(err) } };
}

export function errorResponse(err: unknown, status = 500): Response {
  return new Response(JSON.stringify(normalizeError(err)), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
