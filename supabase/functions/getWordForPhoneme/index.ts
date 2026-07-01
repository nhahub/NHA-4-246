import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { getSupabaseClient, requireAuth } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const supabase = getSupabaseClient(req);
    const userId   = await requireAuth(supabase);

    const url     = new URL(req.url);
    const phoneme = url.searchParams.get("phoneme") ??
      ((await req.json().catch(() => ({}))).phoneme as string | undefined);

    if (!phoneme) {
      return new Response(JSON.stringify({ error: { type: "unknown", message: "phoneme required" } }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("target_language")
      .eq("id", userId)
      .single();

    const lang = profile?.target_language ?? "en";

    const { data, error } = await supabase
      .from("phoneme_example_words")
      .select("word")
      .eq("language", lang)
      .eq("phoneme", phoneme)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: { type: "unknown", message: "No example word found for phoneme" } }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ word: data.word }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err);
  }
});
