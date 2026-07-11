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

    const { explanations, nativeLang } = await req.json();
    if (!Array.isArray(explanations) || !nativeLang) {
      return new Response(JSON.stringify({ error: { type: "unknown", message: "explanations array and nativeLang required" } }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Translate the following explanation strings into ${nativeLang}.
Preserve the original order exactly. Do NOT translate example sentences — only translate explanations.
Return a JSON object: { "translations": ["...", "...", ...] } with the same count and order as the input explanations.

Input:
${JSON.stringify(explanations)}`;

    const raw    = await callGemini(prompt, { jsonMode: true });
    const parsed = JSON.parse(raw);
    const translated = parsed.translations ?? parsed[Object.keys(parsed)[0]] ?? [];

    return new Response(JSON.stringify({ translated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err);
  }
});
