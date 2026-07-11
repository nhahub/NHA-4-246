import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { callGemini } from "../_shared/gemini.ts";
import { getSupabaseClient, requireAuth } from "../_shared/supabase.ts";
import { isTypoTolerantMatch } from "../_shared/levenshtein.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const supabase = getSupabaseClient(req);
    const userId   = await requireAuth(supabase);

    const { wordId, reviewId, userAnswer, questionType } = await req.json();
    if (!wordId || !reviewId || userAnswer === undefined || !questionType) {
      return new Response(JSON.stringify({ error: { type: "unknown", message: "Missing required fields" } }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch word + contexts for evaluation
    const { data: word, error: wErr } = await supabase
      .from("words")
      .select("headword, stage, word_contexts(*)")
      .eq("id", wordId)
      .single();

    if (wErr || !word) throw new Error(wErr?.message ?? "Word not found");

    let isCorrect = false;

    if (questionType === 1 || questionType === 2) {
      // MCQ — frontend sends the selected option; answer is a boolean sent by client
      // Convention: userAnswer is "true" or "false" (stringified)
      isCorrect = userAnswer === "true" || userAnswer === true;
    } else if (questionType === 3 || questionType === 4) {
      // Listen-and-Write and Fill-in-blanks: typo-tolerant string match
      isCorrect = isTypoTolerantMatch(word.headword, userAnswer);
    } else if (questionType === 5) {
      // Nuanced Usage — LLM-graded
      const contextsText = (word.word_contexts as { label: string; explanation: string }[])
        .map((c) => `[${c.label}] ${c.explanation}`)
        .join("\n");

      const prompt = `You are grading a language-learning exercise.
Word: "${word.headword}"
Word contexts:
${contextsText}

User's answer: "${userAnswer}"

Does the user's sentence demonstrate a clear, contextually correct understanding of "${word.headword}"?
Be lenient with minor grammar issues but strict about whether the meaning is used correctly.
Return ONLY JSON: { "correct": true } or { "correct": false, "reason": string }`;

      const raw  = await callGemini(prompt, { jsonMode: true });
      const res  = JSON.parse(raw);
      isCorrect  = res.correct === true;
    } else if (questionType === 6) {
      // Open Production — typo-tolerant match that the word appears in the answer
      isCorrect = isTypoTolerantMatch(word.headword, userAnswer) ||
        userAnswer.toLowerCase().includes(word.headword.toLowerCase());
    }

    // Clear the cached question so the next review cycle generates a fresh one.
    // on_answer marks this row 'completed' and schedule_review inserts a new pending
    // row (which defaults to current_mcq = NULL), so this is belt-and-suspenders.
    try {
      await supabase
        .from("review_queue")
        .update({ current_mcq: null })
        .eq("id", reviewId);
    } catch (clearEx) {
      console.error("[submitAnswer] Failed to clear current_mcq cache", clearEx);
      // Non-fatal: proceed with answer processing regardless
    }

    // Call on_answer RPC (handles stage transitions + scheduling transactionally)
    const { data: rpcData, error: rpcErr } = await supabase.rpc("on_answer", {
      p_review_id:  reviewId,
      p_word_id:    wordId,
      p_is_correct: isCorrect,
    });

    if (rpcErr) throw new Error(rpcErr.message);

    const result = Array.isArray(rpcData) ? rpcData[0] : rpcData;

    return new Response(JSON.stringify({ isCorrect, newStage: result?.new_stage ?? word.stage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err);
  }
});
