import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { callGemini } from "../_shared/gemini.ts";
import { getSupabaseClient, requireAuth } from "../_shared/supabase.ts";

const DAILY_REVIEW_CAP = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse();

  try {
    const supabase = getSupabaseClient(req);
    const userId   = await requireAuth(supabase);

    // Fetch up to DAILY_REVIEW_CAP due review items
    const { data: queueRows, error: qErr } = await supabase
      .from("review_queue")
      .select("id, word_id, question_type, scheduled_for")
      .eq("user_id", userId)
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(DAILY_REVIEW_CAP);

    if (qErr) throw new Error(qErr.message);
    if (!queueRows || queueRows.length === 0) {
      return new Response(JSON.stringify({ queue: [], totalToday: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load word + contexts for each queue item
    const wordIds = [...new Set(queueRows.map((r) => r.word_id))];
    const { data: words, error: wErr } = await supabase
      .from("words")
      .select("id, headword, native_synonyms, stage, word_contexts(*)")
      .in("id", wordIds);

    if (wErr) throw new Error(wErr.message);

    const wordMap = new Map(words?.map((w) => [w.id, w]) ?? []);

    // Generate question content via Gemini for each queue item
    const queue = await Promise.all(
      queueRows.map(async (item) => {
        const word = wordMap.get(item.word_id);
        if (!word) return null;

        let questionType = item.question_type;
        let questionContent: unknown = null;

        try {
          questionContent = await generateQuestion(word, questionType);
        } catch {
          // Fallback to type 1 (MCQ) if generation fails for types 3-6
          if (questionType >= 3) {
            questionType = questionType % 2 === 0 ? 2 : 1;
            try {
              questionContent = await generateQuestion(word, questionType);
            } catch {
              questionContent = { fallback: true };
            }
          }
        }

        return {
          reviewId:     item.id,
          wordId:       item.word_id,
          headword:     word.headword,
          questionType,
          questionContent,
          scheduledFor: item.scheduled_for,
        };
      })
    );

    const filtered = queue.filter(Boolean);

    return new Response(JSON.stringify({ queue: filtered, totalToday: filtered.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err);
  }
});

async function generateQuestion(
  word: { headword: string; native_synonyms: string[]; word_contexts: { label: string; explanation: string; example: string }[] },
  questionType: number
): Promise<unknown> {
  const contextsText = word.word_contexts
    .map((c) => `[${c.label}] ${c.explanation} — "${c.example}"`)
    .join("\n");

  const prompts: Record<number, string> = {
    1: `Generate a multiple-choice question (4 options) testing knowledge of the word "${word.headword}".
Context: ${contextsText}
Return JSON: { "question": string, "options": string[], "correctIndex": number }`,

    2: `Generate a REVERSED multiple-choice question: give the definition/synonyms (${word.native_synonyms.join(", ")}) and ask the user to pick the correct word from 4 options.
Word: "${word.headword}"
Return JSON: { "question": string, "options": string[], "correctIndex": number }`,

    3: `Generate a listen-and-write prompt for the word "${word.headword}". The user will hear the word and must type it.
Return JSON: { "instruction": "Listen and type the word you hear", "answer": "${word.headword}" }`,

    4: `Generate a fill-in-the-blanks sentence for the word "${word.headword}" using one of these examples: ${word.word_contexts.map((c) => c.example).join(" / ")}.
Replace the word with _____.
Return JSON: { "sentence": string, "answer": "${word.headword}" }`,

    5: `Generate a nuanced usage question for the word "${word.headword}". Ask the user to write a sentence demonstrating they understand the distinction between its usages.
Context: ${contextsText}
Return JSON: { "question": string, "rubric": string, "word": "${word.headword}" }`,

    6: `Generate an open production prompt: ask the user to write a sentence using "${word.headword}" naturally.
Return JSON: { "instruction": string, "word": "${word.headword}" }`,
  };

  const raw    = await callGemini(prompts[questionType], { jsonMode: true });
  return JSON.parse(raw);
}
