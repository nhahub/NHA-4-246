import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { getSupabaseClient, requireAuth } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const supabase = getSupabaseClient(req);
    const userId   = await requireAuth(supabase);

    const url   = new URL(req.url);
    const month = url.searchParams.get("month") ??
      ((await req.json().catch(() => ({}))).month as string | undefined);

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return new Response(JSON.stringify({ error: { type: "unknown", message: "month required (YYYY-MM)" } }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startDate = `${month}-01T00:00:00.000Z`;
    const [year, mon] = month.split("-").map(Number);
    const nextMonth   = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, "0")}`;
    const endDate     = `${nextMonth}-01T00:00:00.000Z`;

    const { data, error } = await supabase
      .from("words")
      .select("id, headword, native_synonyms, stage, active, saved_at, mastered_at, source, word_contexts(*)")
      .eq("user_id", userId)
      .gte("saved_at", startDate)
      .lt("saved_at", endDate)
      .order("saved_at", { ascending: false });

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify(data ?? []), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err);
  }
});
