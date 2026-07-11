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
    let userId: string;
    try {
      userId = await requireAuth(supabase);
    } catch {
      return new Response(JSON.stringify({ error: { type: "unauthorized", message: "Missing or invalid Authorization header" } }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch up to DAILY_REVIEW_CAP due review items (include current_mcq for cache check)
    const { data: queueRows, error: qErr } = await supabase
      .from("review_queue")
      .select("id, word_id, question_type, scheduled_for, current_mcq")
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

    // Generate (or load from cache) question content for each queue item
    const queue = await Promise.all(
      queueRows.map(async (item) => {
        const word = wordMap.get(item.word_id);
        if (!word) return null;

        let questionType = item.question_type;
        let questionContent: unknown = null;
        let fromCache = false;

        // ── Cache check ────────────────────────────────────────────────
        if (item.current_mcq !== null && item.current_mcq !== undefined) {
          // Cache hit: reuse previously generated question, skip Gemini
          questionContent = item.current_mcq;
          fromCache = true;
        } else {
          // Cache miss: call Gemini, then persist result to DB
          try {
            questionContent = await generateQuestion(word, questionType);
          } catch {
            if (questionType >= 3) {
              // For audio/production types, fall back to MCQ (type 1)
              questionType = questionType % 2 === 0 ? 2 : 1;
              try {
                questionContent = await generateQuestion(word, questionType);
              } catch {
                questionContent = { fallback: true };
              }
            } else {
              // For types 1 and 2 Gemini failure: synthesise options from the
              // word's own synonyms so the card is always renderable.
              questionContent = { fallback: true };
            }
          }

          // ── Save to cache (best-effort; never blocks the response) ─────
          if (questionContent && !(questionContent as Record<string, unknown>).fallback) {
            try {
              const { error: cacheErr } = await supabase
                .from("review_queue")
                .update({ current_mcq: questionContent })
                .eq("id", item.id);
              if (cacheErr) {
                console.error("[getMasterySession] Failed to cache MCQ for review", item.id, cacheErr.message);
              }
            } catch (cacheEx) {
              console.error("[getMasterySession] Exception caching MCQ for review", item.id, cacheEx);
            }
          }
        }

        // ── Flatten questionContent into the ReviewItem top-level fields ─
        // This logic is identical regardless of cache hit or miss.
        const qc = questionContent as Record<string, unknown> | null;
        const flat: Record<string, unknown> = {
          reviewId:     item.id,
          wordId:       item.word_id,
          headword:     word.headword,
          questionType,
          cardData: {
            id:           item.word_id,
            headword:     word.headword,
            synonyms:     word.native_synonyms ?? [],
            contexts:     (word.word_contexts ?? []).map((c: { label: string; explanation: string; example: string }) => ({
              label:       c.label,
              explanation: c.explanation,
              example:     c.example,
            })),
            stage:        word.stage,
            stage6_streak: 0,
            active:       true,
          },
        };

        if (qc && !qc.fallback) {
          if (questionType === 1) {
            // { question, options, correctIndex } → mcqOptions + correctOption
            const opts = qc.options as string[] | undefined;
            const idx  = qc.correctIndex as number | undefined;
            flat.mcqOptions    = opts;
            flat.correctOption = (opts && idx !== undefined) ? opts[idx] : undefined;
          } else if (questionType === 2) {
            // { question, options, correctIndex } → reversedDefinition + reversedOptions + correctOption
            const opts = qc.options as string[] | undefined;
            const idx  = qc.correctIndex as number | undefined;
            flat.reversedDefinition = qc.question;
            flat.reversedOptions    = opts;
            flat.correctOption      = (opts && idx !== undefined) ? opts[idx] : undefined;
          } else if (questionType === 3) {
            // { instruction, answer } — type 3 is audio; audioUrl cannot be provided server-side
            // The frontend uses audioUrl for TTS; leave it undefined (client will use headword)
            flat.audioUrl = undefined;
          } else if (questionType === 4) {
            // { sentence, answer } → fillSentence
            flat.fillSentence = qc.sentence;
          } else if (questionType === 5) {
            // { question, rubric, word } → nuancedPrompt
            flat.nuancedPrompt = qc.question;
          } else if (questionType === 6) {
            // { instruction, word } → productionPrompt
            flat.productionPrompt = qc.instruction;
          }
        } else if (questionType === 1 || questionType === 2) {
          // Gemini failed — build minimal playable options from the word's synonyms.
          // Correct answer is the headword (type 1) or the first synonym (type 2).
          const distractors = (word.native_synonyms ?? []).slice(0, 3);
          const opts = [word.headword, ...distractors].slice(0, 4);
          if (questionType === 1) {
            flat.mcqOptions    = opts;
            flat.correctOption = word.headword;
          } else {
            flat.reversedDefinition = (word.native_synonyms ?? []).join(", ") || word.headword;
            flat.reversedOptions    = opts;
            flat.correctOption      = word.headword;
          }
        }

        return flat;
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
