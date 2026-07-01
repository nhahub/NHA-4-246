import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { getSupabaseClient, requireAuth } from "../_shared/supabase.ts";

const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY") ?? "";
const YT_BASE         = "https://www.googleapis.com/youtube/v3";

// Cold-start threshold (spec: < 5 watch history entries)
const COLD_START_THRESHOLD = 5;

// Exploration injection: 1 out of every 5 results is outside user's usual categories
const EXPLORE_RATIO = 0.2;

// NOTE: The original product spec references a previously-defined personalization algorithm
// that isn't included in the backend prompt. This implementation uses a reasonable
// interpretation: extract categories from watch history, query YouTube filtered by those
// categories + target language, inject EXPLORE_RATIO of off-category suggestions.
// Swap this logic for the exact algorithm when it is provided.

serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const supabase = getSupabaseClient(req);
    const userId   = await requireAuth(supabase);

    // Get user's target language
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("target_language")
      .eq("id", userId)
      .single();

    if (pErr || !profile) throw new Error("Profile not found");

    const { data: history, error: hErr } = await supabase
      .from("watch_history")
      .select("video_id, categories")
      .eq("user_id", userId)
      .order("watched_at", { ascending: false });

    if (hErr) throw new Error(hErr.message);

    if ((history?.length ?? 0) < COLD_START_THRESHOLD) {
      return new Response(JSON.stringify({ promptMessage: "Search for topics you love to start getting recommendations!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const watchedIds = new Set(history!.map((h) => h.video_id));

    // Tally category frequencies
    const categoryFreq = new Map<string, number>();
    for (const h of history!) {
      for (const cat of (h.categories ?? [])) {
        categoryFreq.set(cat, (categoryFreq.get(cat) ?? 0) + 1);
      }
    }

    const topCategories = [...categoryFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    const langCode   = profile.target_language === "fr" ? "fr" : "en";
    const regionCode = profile.target_language === "fr" ? "FR" : "US";

    // Personalized results — query top categories
    const personalizedQuery = topCategories.join(" OR ") || "language learning";
    const personalizedVids  = await searchYouTube(personalizedQuery, langCode, regionCode, watchedIds, 20);

    // Exploration — pick a random category outside the user's usual ones
    const allCategories = ["science", "history", "philosophy", "technology", "art", "travel", "cooking"];
    const freshCats     = allCategories.filter((c) => !topCategories.includes(c));
    const explorationQuery = freshCats[Math.floor(Math.random() * freshCats.length)] ?? "documentary";
    const explorationVids  = await searchYouTube(explorationQuery, langCode, regionCode, watchedIds, 5);

    // Merge: inject ~EXPLORE_RATIO exploration videos
    const personalizedCount = Math.round(20 * (1 - EXPLORE_RATIO));
    const merged = [
      ...personalizedVids.slice(0, personalizedCount),
      ...explorationVids.slice(0, Math.round(20 * EXPLORE_RATIO)),
    ];

    return new Response(JSON.stringify({ videos: merged }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err);
  }
});

async function searchYouTube(
  query: string,
  lang: string,
  regionCode: string,
  watchedIds: Set<string>,
  maxResults: number
): Promise<unknown[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch(
      `${YT_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video` +
      `&relevanceLanguage=${lang}&regionCode=${regionCode}&maxResults=${maxResults + 10}` +
      `&key=${YOUTUBE_API_KEY}`,
      { signal: controller.signal }
    );
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
  clearTimeout(timer);

  if (!res.ok) throw new Error(`YouTube API HTTP ${res.status}`);

  const data = await res.json();
  return (data.items ?? [])
    .filter((item: { id: { videoId: string } }) => !watchedIds.has(item.id.videoId))
    .slice(0, maxResults)
    .map((item: { id: { videoId: string }; snippet: { title: string; description: string; thumbnails: unknown; channelTitle: string } }) => ({
      videoId:     item.id.videoId,
      title:       item.snippet.title,
      description: item.snippet.description,
      thumbnails:  item.snippet.thumbnails,
      channel:     item.snippet.channelTitle,
    }));
}
