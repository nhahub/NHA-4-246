import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { getSupabaseClient, requireAuth } from "../_shared/supabase.ts";

const YOUGLISH_API_KEY = Deno.env.get("YOUGLISH_API_KEY") ?? "";
const YOUGLISH_BASE    = "https://youglish.com/api/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const supabase = getSupabaseClient(req);
    await requireAuth(supabase);

    const { word, targetLang } = await req.json();
    if (!word || !targetLang) {
      return new Response(JSON.stringify({ error: { type: "unknown", message: "word and targetLang required" } }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);

    let res: Response;
    try {
      res = await fetch(
        `${YOUGLISH_BASE}/search?query=${encodeURIComponent(word)}&lang=${targetLang}&key=${YOUGLISH_API_KEY}`,
        { signal: controller.signal }
      );
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
    clearTimeout(timer);

    if (res.status === 429) throw new Error("429 rate limited by YouGlish");
    if (!res.ok) throw new Error(`YouGlish HTTP ${res.status}`);

    const data = await res.json();

    // YouGlish returns a list of video hits; surface the first embed URL or null
    const firstHit = data?.results?.[0];
    const videoUrl = firstHit
      ? `https://www.youtube.com/embed/${firstHit.vid}?start=${firstHit.start_time ?? 0}`
      : null;

    return new Response(JSON.stringify({ videoUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err);
  }
});
