import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { callGemini } from "../_shared/gemini.ts";
import { getSupabaseClient, requireAuth } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const supabase = getSupabaseClient(req);
    await requireAuth(supabase);

    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: { type: "unknown", message: "text is required" } }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Check ONLY for spelling mistakes and typos in the following text.
Do NOT suggest grammar rewrites or style changes.
Text: "${text}"

Return ONLY valid JSON in one of these two shapes (no markdown fences):
- No typos: { "hasTypos": false }
- Has typos: { "hasTypos": true, "suggestion": "<corrected text with only spelling fixed>" }`;

    const raw  = await callGemini(prompt, { jsonMode: true });
    let result: { hasTypos: boolean; suggestion?: string };
    try {
      result = JSON.parse(raw);
    } catch {
      console.error("[checkTypos] Gemini returned non-JSON:", raw);
      return new Response(
        JSON.stringify({ error: { type: "ai_error", message: "AI response could not be parsed. Please try again." } }),
        { status: 502, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err);
  }
});
