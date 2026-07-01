import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { getSupabaseClient, requireAuth } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const supabase = getSupabaseClient(req);
    const userId   = await requireAuth(supabase);

    // Group words by calendar month, return count per month
    const { data, error } = await supabase
      .from("words")
      .select("saved_at")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });

    if (error) throw new Error(error.message);

    const monthMap = new Map<string, number>();
    for (const row of data ?? []) {
      const month = row.saved_at.slice(0, 7); // "YYYY-MM"
      monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
    }

    const months = Array.from(monthMap.entries()).map(([month, wordCount]) => ({ month, wordCount }));

    return new Response(JSON.stringify(months), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err);
  }
});
