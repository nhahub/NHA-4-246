import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { getSupabaseClient, requireAuth } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const supabase = getSupabaseClient(req);
    const userId   = await requireAuth(supabase);

    const { data: profile } = await supabase
      .from("profiles")
      .select("target_language")
      .eq("id", userId)
      .single();

    const lang = profile?.target_language ?? "en";

    // Left-join phoneme_reference against phoneme_assessments for this user
    const { data: refs, error: rErr } = await supabase
      .from("phoneme_reference")
      .select("phoneme, label")
      .eq("language", lang)
      .order("phoneme");

    if (rErr) throw new Error(rErr.message);

    const { data: assessments, error: aErr } = await supabase
      .from("phoneme_assessments")
      .select("phoneme, status")
      .eq("user_id", userId)
      .eq("target_language", lang);

    if (aErr) throw new Error(aErr.message);

    const assessMap = new Map((assessments ?? []).map((a) => [a.phoneme, a.status]));

    // Unattempted phonemes get a neutral status; order best-performing first
    const ORDER: Record<string, number> = { excellent: 0, good: 1, wrong: 2, neutral: 3 };

    const phonemes = (refs ?? []).map((r) => ({
      phoneme: r.phoneme,
      label:   r.label,
      status:  (assessMap.get(r.phoneme) as "excellent" | "good" | "wrong") ?? "neutral",
    })).sort((a, b) => ORDER[a.status] - ORDER[b.status]);

    return new Response(JSON.stringify(phonemes), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err);
  }
});
