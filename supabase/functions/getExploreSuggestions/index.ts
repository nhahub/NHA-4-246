import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { callGemini } from "../_shared/gemini.ts";
import { getSupabaseClient, requireAuth } from "../_shared/supabase.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

// Number of recent vault words to sample as seeds
const SAMPLE_SIZE  = 20;
const SEED_COUNT   = 3;
const OUTPUT_COUNT = 5;

serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const supabase = getSupabaseClient(req);
    const userId   = await requireAuth(supabase);

    const { allowed } = checkRateLimit(userId, "getExploreSuggestions", { maxCalls: 10, windowMs: 60_000 });
    if (!allowed) {
      return new Response(JSON.stringify({ error: { type: "rate_limited", message: "Too many requests" } }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("native_language, target_language")
      .eq("id", userId)
      .single();

    // Fetch recent vault words as seeds
    const { data: vaultWords, error: vErr } = await supabase
      .from("words")
      .select("id, headword")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false })
      .limit(SAMPLE_SIZE);

    if (vErr) throw new Error(vErr.message);
    if (!vaultWords || vaultWords.length === 0) {
      return new Response(JSON.stringify({ emptyMessage: "Save some words to start exploring!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick seed sample (random subset)
    const shuffled  = [...vaultWords].sort(() => Math.random() - 0.5);
    const seeds     = shuffled.slice(0, Math.min(SEED_COUNT, shuffled.length));
    const seedWords = seeds.map((s) => s.headword).join(", ");

    // Ask Gemini for semantically related vocabulary suggestions
    const suggestionPrompt = `Given these ${profile?.target_language ?? "en"} vocabulary words: ${seedWords}
Suggest exactly ${OUTPUT_COUNT} semantically related vocabulary items (words or phrases) in ${profile?.target_language ?? "en"} that a language learner would find useful.
Do NOT repeat the seed words.
Return ONLY a JSON array of strings: ["word1", "word2", ...]`;

    const rawSuggestions = await callGemini(suggestionPrompt, { jsonMode: true });
    const suggestions: string[] = JSON.parse(rawSuggestions);

    // Generate a full DetailCard for each suggestion (reusing generateDetailCard logic inline)
    const cards = await Promise.all(
      suggestions.map(async (suggestion) => {
        const prompt = `You are a language-learning assistant. Generate a full vocabulary card for: "${suggestion}"
Native language: ${profile?.native_language ?? "en"}
Target language: ${profile?.target_language ?? "en"}

Return ONLY valid JSON (no markdown):
{
  "mode": "full",
  "card": {
    "headword": "${suggestion}",
    "nativeSynonyms": ["<1-3 synonyms in ${profile?.native_language ?? "en"}>"],
    "contexts": [
      { "label": "<domain>", "explanation": "<explanation in ${profile?.native_language ?? "en"}>", "example": "<sentence with **${suggestion}** bolded>" }
    ]
  }
}`;
        try {
          const raw  = await callGemini(prompt, { jsonMode: true });
          const parsed = JSON.parse(raw);
          return parsed.card ?? null;
        } catch {
          return null;
        }
      })
    );

    return new Response(JSON.stringify({ cards: cards.filter(Boolean) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err);
  }
});
