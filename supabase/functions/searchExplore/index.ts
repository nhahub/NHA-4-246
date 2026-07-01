import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { callGemini, isSafetyBlock } from "../_shared/gemini.ts";
import { getSupabaseClient, requireAuth } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const supabase = getSupabaseClient(req);
    const userId   = await requireAuth(supabase);

    const { query, lang } = await req.json() as { query: string; lang: "native" | "target" };
    if (!query || !lang) {
      return new Response(JSON.stringify({ error: { type: "unknown", message: "query and lang required" } }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("native_language, target_language")
      .eq("id", userId)
      .single();

    const targetLang = profile?.target_language ?? "en";
    const nativeLang = profile?.native_language ?? "en";

    // Step 1: get a cluster of related vocab items
    const clusterPrompt = `A language learner typed this search query: "${query}"
The query is in: ${lang === "native" ? nativeLang : targetLang}
Target learning language: ${targetLang}

Generate a cluster of 6-8 semantically related ${targetLang} vocabulary words or phrases that address this concept.
Example: for "manipulating language to hide the truth" → [Weasel words, Gaslighting, Cherry-picking, Spin, Equivocation, Doublespeak, Paltering, Straw manning]
Return ONLY a JSON array of strings.`;

    let cluster: string[];
    try {
      const raw = await callGemini(clusterPrompt, { jsonMode: true });
      cluster   = JSON.parse(raw);
    } catch (err) {
      if (isSafetyBlock(err)) {
        return new Response(JSON.stringify({ safetyError: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw err;
    }

    // Step 2: generate a DetailCard for each vocab item
    const cards = await Promise.all(
      cluster.map(async (word) => {
        const cardPrompt = `Generate a full vocabulary card for the ${targetLang} word/phrase: "${word}"
Native language: ${nativeLang}

Return ONLY valid JSON (no markdown):
{
  "headword": "${word}",
  "nativeSynonyms": ["<1-3 synonyms in ${nativeLang}>"],
  "contexts": [
    { "label": "<domain>", "explanation": "<explanation in ${nativeLang}>", "example": "<sentence with **${word}** bolded>" }
  ]
}`;
        try {
          const raw    = await callGemini(cardPrompt, { jsonMode: true });
          return JSON.parse(raw);
        } catch (err) {
          if (isSafetyBlock(err)) return null; // skip unsafe individual words
          return null;
        }
      })
    );

    return new Response(JSON.stringify({ cards: cards.filter(Boolean) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    if (isSafetyBlock(err)) {
      return new Response(JSON.stringify({ safetyError: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return errorResponse(err);
  }
});
