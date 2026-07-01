import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { getSupabaseClient, requireAuth } from "../_shared/supabase.ts";

const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY") ?? "";
const YT_BASE         = "https://www.googleapis.com/youtube/v3";

function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1);
    if (parsed.hostname.includes("youtube.com")) return parsed.searchParams.get("v");
  } catch {
    // not a URL
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const supabase = getSupabaseClient(req);
    const userId   = await requireAuth(supabase);

    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: { type: "unknown", message: "url required" } }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return new Response(JSON.stringify({ valid: false, reason: "invalid_url" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("target_language")
      .eq("id", userId)
      .single();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);

    let res: Response;
    try {
      res = await fetch(
        `${YT_BASE}/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`,
        { signal: controller.signal }
      );
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
    clearTimeout(timer);

    if (!res.ok) throw new Error(`YouTube API HTTP ${res.status}`);

    const data  = await res.json();
    const item  = data.items?.[0];

    if (!item) return new Response(JSON.stringify({ valid: false, reason: "not_found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // Best-effort language check: compare defaultAudioLanguage or defaultLanguage
    const videoLang = (item.snippet?.defaultAudioLanguage ?? item.snippet?.defaultLanguage ?? "").slice(0, 2);
    const targetLang = profile?.target_language ?? "";

    if (targetLang && videoLang && videoLang !== targetLang) {
      return new Response(JSON.stringify({ valid: false, reason: "wrong_language" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ valid: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err);
  }
});
