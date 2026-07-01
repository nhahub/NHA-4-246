import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { getSupabaseClient, requireAuth } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const supabase = getSupabaseClient(req);
    const userId   = await requireAuth(supabase);

    const { word, source } = await req.json() as {
      word: {
        headword: string;
        nativeSynonyms: string[];
        contexts: { label: string; explanation: string; example: string }[];
      };
      source: "manual" | "watch" | "explore" | "selection";
    };

    if (!word?.headword || !word?.nativeSynonyms || !word?.contexts || !source) {
      return new Response(JSON.stringify({ error: { type: "unknown", message: "Missing required fields" } }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert into words
    const { data: wordRow, error: wordErr } = await supabase
      .from("words")
      .insert({
        user_id:         userId,
        headword:        word.headword,
        native_synonyms: word.nativeSynonyms,
        stage:           1,
        stage6_streak:   0,
        active:          true,
        source,
      })
      .select("id")
      .single();

    if (wordErr) throw new Error(wordErr.message);

    // Insert word_contexts
    const contexts = word.contexts.map((c, i) => ({
      word_id:    wordRow.id,
      label:      c.label,
      explanation: c.explanation,
      example:    c.example,
      sort_order: i,
    }));
    const { error: ctxErr } = await supabase.from("word_contexts").insert(contexts);
    if (ctxErr) throw new Error(ctxErr.message);

    // Schedule first review via RPC
    const { error: schedErr } = await supabase.rpc("schedule_review", { p_word_id: wordRow.id });
    if (schedErr) throw new Error(schedErr.message);

    return new Response(JSON.stringify({ wordId: wordRow.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err);
  }
});
