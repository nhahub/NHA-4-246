import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { getSupabaseClient, requireAuth } from "../_shared/supabase.ts";

const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY") ?? "";
const YT_BASE         = "https://www.googleapis.com/youtube/v3";

serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const supabase = getSupabaseClient(req);
    const userId   = await requireAuth(supabase);

    const url     = new URL(req.url);
    const videoId = url.searchParams.get("videoId") ??
      ((await req.json().catch(() => ({}))).videoId as string | undefined);

    if (!videoId) {
      return new Response(JSON.stringify({ error: { type: "unknown", message: "videoId required" } }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("target_language")
      .eq("id", userId)
      .single();

    const lang = profile?.target_language === "fr" ? "fr" : "en";

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);

    let res: Response;
    try {
      // First, list caption tracks for the video
      res = await fetch(
        `${YT_BASE}/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`,
        { signal: controller.signal }
      );
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
    clearTimeout(timer);

    if (!res.ok) throw new Error(`YouTube Captions API HTTP ${res.status}`);

    const trackData = await res.json();
    const tracks: { id: string; snippet: { language: string; trackKind: string } }[] = trackData.items ?? [];

    // Prefer ASR or standard tracks in the target language
    const track =
      tracks.find((t) => t.snippet.language.startsWith(lang) && t.snippet.trackKind !== "asr") ??
      tracks.find((t) => t.snippet.language.startsWith(lang)) ??
      tracks[0];

    if (!track) {
      return new Response(JSON.stringify({ captions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download caption content (requires OAuth for private — works for public ASR/manual captions)
    const captionController = new AbortController();
    const captionTimer = setTimeout(() => captionController.abort(), 20_000);

    let captionRes: Response;
    try {
      captionRes = await fetch(
        `${YT_BASE}/captions/${track.id}?tfmt=srv3&key=${YOUTUBE_API_KEY}`,
        { signal: captionController.signal }
      );
    } catch (err) {
      clearTimeout(captionTimer);
      throw err;
    }
    clearTimeout(captionTimer);

    if (!captionRes.ok) {
      // Captions require OAuth for most videos — return empty captions gracefully
      return new Response(JSON.stringify({ captions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const captionXml = await captionRes.text();

    // Parse YouTube's timedtext XML format
    const captions = parseCaptionXml(captionXml);

    return new Response(JSON.stringify({ captions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err);
  }
});

function parseCaptionXml(xml: string): { start: number; end: number; text: string }[] {
  const results: { start: number; end: number; text: string }[] = [];
  const regex = /<p[^>]*\bt="(\d+)"[^>]*\bd="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    const start = parseInt(match[1], 10) / 1000;
    const dur   = parseInt(match[2], 10) / 1000;
    const text  = match[3].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
    if (text) results.push({ start, end: start + dur, text });
  }
  return results;
}
