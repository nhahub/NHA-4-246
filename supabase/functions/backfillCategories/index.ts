// ─── One-time backfill: normalise watch_history.categories ────────────────────
// Reads the current user's watch_history rows, applies the canonical normalizer
// to every element in each row's `categories` array, and updates changed rows.
//
// Uses the authenticated user's own JWT (RLS-compliant) so no service-role key
// is needed.  Invoke once after deploying the normalizer:
//
//   POST /functions/v1/backfillCategories   (with normal auth header)
//
// After confirming the backfill looks correct, this function can be deleted.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { getSupabaseClient, requireAuth } from "../_shared/supabase.ts";
import { normalizeCategory } from "../_shared/normalizeCategory.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const supabase = getSupabaseClient(req);
    const userId   = await requireAuth(supabase);

    // ── Fetch this user's watch_history rows ──────────────────────────────
    const { data: rows, error: fetchErr } = await supabase
      .from("watch_history")
      .select("id, video_id, categories")
      .eq("user_id", userId)
      .order("watched_at", { ascending: true });

    if (fetchErr) throw new Error(`Fetch failed: ${fetchErr.message}`);
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({
        message: "No watch_history rows found for this user.",
        totalRows: 0,
        updatedRows: 0,
        samples: [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Normalise and collect updates ─────────────────────────────────────
    const updates: Array<{
      id: string;
      videoId: string;
      before: string[];
      after: string[];
    }> = [];

    for (const row of rows) {
      const raw: string[] = row.categories ?? [];
      // Normalise each category string, then deduplicate
      const normalized = [...new Set(raw.map((c: string) => normalizeCategory(c)))];

      // Only update if the result differs from the original
      const changed =
        raw.length !== normalized.length ||
        raw.some((c: string, i: number) => c !== normalized[i]);

      if (changed) {
        updates.push({
          id: row.id,
          videoId: row.video_id,
          before: raw,
          after: normalized,
        });
      }
    }

    // ── Apply updates ─────────────────────────────────────────────────────
    let updatedCount = 0;
    for (const upd of updates) {
      const { error: updErr } = await supabase
        .from("watch_history")
        .update({ categories: upd.after })
        .eq("id", upd.id);

      if (updErr) {
        console.warn(`[backfill] Update failed for id=${upd.id}: ${updErr.message}`);
      } else {
        updatedCount++;
      }
    }

    // ── Build sample before/after (first 5 changed rows) ──────────────────
    const samples = updates.slice(0, 5).map((u) => ({
      id: u.id,
      videoId: u.videoId,
      before: u.before,
      after: u.after,
    }));

    return new Response(JSON.stringify({
      message: "Backfill complete.",
      userId,
      totalRows: rows.length,
      updatedRows: updatedCount,
      unchangedRows: rows.length - updates.length,
      skippedRows: rows.length - updates.length,
      samples,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
