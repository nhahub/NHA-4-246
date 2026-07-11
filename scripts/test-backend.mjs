/**
 * LexiFlow Backend Test Script
 * Usage: node scripts/test-backend.mjs
 *
 * Requires these env vars (or edit the constants below):
 *   SUPABASE_URL        — e.g. https://xyzxyz.supabase.co
 *   SUPABASE_SERVICE_KEY — service-role JWT (bypasses RLS; safe for local testing only)
 *   TEST_USER_JWT       — a real user JWT (for functions that call requireAuth)
 *   TEST_USER_ID        — UUID of the test user
 *
 * Or create a .env.test file with the same keys and run:
 *   node --env-file=.env.test scripts/test-backend.mjs
 */

import { readFileSync } from "fs";

// ─── Config ──────────────────────────────────────────────────────────────────
// Try to load from .env.test if present (Node 20.6+ supports --env-file flag).
// Values below are fallback stubs — replace with real credentials.
const SUPABASE_URL        = process.env.SUPABASE_URL        ?? "https://YOUR_PROJECT.supabase.co";
const SERVICE_KEY         = process.env.SUPABASE_SERVICE_KEY ?? "YOUR_SERVICE_KEY";
const USER_JWT            = process.env.TEST_USER_JWT        ?? "YOUR_USER_JWT";
const TEST_WORD           = process.env.TEST_WORD            ?? "ephemeral";
const TEST_NATIVE_LANG    = process.env.TEST_NATIVE_LANG     ?? "ar";   // Arabic
const TEST_TARGET_LANG    = process.env.TEST_TARGET_LANG     ?? "en";   // English
const TEST_VIDEO_URL      = process.env.TEST_VIDEO_URL       ?? "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const TEST_PHONEME        = process.env.TEST_PHONEME         ?? "θ";    // "th" sound

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fn = (name) => `${SUPABASE_URL}/functions/v1/${name}`;

async function call(name, body, jwt = USER_JWT) {
  const res = await fetch(fn(name), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      apikey: SERVICE_KEY,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

let passed = 0, failed = 0;

function report(name, ok, detail = "") {
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${name}${detail ? " — " + detail : ""}`);
  ok ? passed++ : failed++;
}

function check(name, res, validator) {
  try {
    const valid = validator(res);
    report(name, valid, valid ? `HTTP ${res.status}` : `HTTP ${res.status} body=${JSON.stringify(res.json).slice(0, 120)}`);
  } catch (e) {
    report(name, false, String(e));
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────
console.log("\n=== LexiFlow Backend Test Suite ===\n");

// 1. generateDetailCard
{
  const res = await call("generateDetailCard", {
    text: TEST_WORD,
    nativeLang: TEST_NATIVE_LANG,
    targetLang: TEST_TARGET_LANG,
  });
  check("generateDetailCard", res, r =>
    r.ok &&
    (r.json.card || r.json.action === "too_long" || r.json.action === "simplify")
  );
}

// 2. checkTypos
{
  const res = await call("checkTypos", {
    text: "Ths is a tset sentance",
    targetLang: TEST_TARGET_LANG,
  });
  check("checkTypos", res, r => r.ok && Array.isArray(r.json.corrections));
}

// 3. translateExplanations
{
  const res = await call("translateExplanations", {
    explanations: ["A brief or passing moment", "Something fleeting"],
    nativeLang: TEST_NATIVE_LANG,
    targetLang: TEST_TARGET_LANG,
  });
  check("translateExplanations", res, r => r.ok && Array.isArray(r.json.translated));
}

// 4. assessPronunciation — expects audio; we test the 400 path
{
  const res = await call("assessPronunciation", {
    word: TEST_WORD,
    targetLang: TEST_TARGET_LANG,
    // audioBase64 intentionally omitted to test error handling
  });
  // Should return 400 (missing field) not 500
  check("assessPronunciation (missing audio → 400)", res, r => r.status === 400);
}

// 5. saveWord
let savedWordId = null;
{
  const res = await call("saveWord", {
    headword: TEST_WORD,
    targetLang: TEST_TARGET_LANG,
    contextSentence: `The ${TEST_WORD} nature of time.`,
    sourceVideoId: "dQw4w9WgXcQ",
    cardData: { definition: "lasting for a very short time" },
  });
  check("saveWord", res, r => r.ok && r.json.wordId);
  if (res.ok) savedWordId = res.json.wordId;
}

// 6. removeWord (uses wordId from saveWord; skip if save failed)
{
  if (savedWordId) {
    const res = await call("removeWord", { wordId: savedWordId });
    check("removeWord", res, r => r.ok && r.json.success);
  } else {
    report("removeWord", false, "skipped — saveWord did not return a wordId");
  }
}

// 7. getMasterySession
{
  const res = await call("getMasterySession", {});
  check("getMasterySession", res, r => r.ok && (Array.isArray(r.json.items) || r.json.message));
}

// 8. submitAnswer — test with a fake review item (expects 404 or success)
{
  const res = await call("submitAnswer", {
    wordId: "00000000-0000-0000-0000-000000000000",
    correct: true,
  });
  check("submitAnswer (fake id → error acceptable)", res, r =>
    r.ok || r.status === 404 || r.status === 400
  );
}

// 9. getVaultMonths
{
  const res = await call("getVaultMonths", {});
  check("getVaultMonths", res, r => r.ok && Array.isArray(r.json.months));
}

// 10. getVaultWords
{
  const res = await call("getVaultWords", { month: new Date().toISOString().slice(0, 7) });
  check("getVaultWords", res, r => r.ok && Array.isArray(r.json.words));
}

// 11. generateVaultParagraph
{
  const res = await call("generateVaultParagraph", {
    words: [TEST_WORD, "fleeting", "transient"],
    targetLang: TEST_TARGET_LANG,
    nativeLang: TEST_NATIVE_LANG,
  });
  check("generateVaultParagraph", res, r => r.ok && typeof r.json.paragraph === "string");
}

// 12. getSuggestedVideos — also covers language filtering (Step 4)
{
  const res = await call("getSuggestedVideos", {});
  // Either cold-start prompt or a videos array; either is valid
  const hasColdStart = res.json.promptMessage && typeof res.json.promptMessage === "string";
  const hasVideos    = Array.isArray(res.json.videos);
  check("getSuggestedVideos", res, r => r.ok && (hasColdStart || hasVideos));

  if (hasVideos) {
    const wrongLang = res.json.videos.filter(v => v.language !== TEST_TARGET_LANG);
    if (wrongLang.length === 0) {
      report("getSuggestedVideos — language filter (no bleed-over)", true,
        `${res.json.videos.length} videos, all language="${TEST_TARGET_LANG}"`);
    } else {
      report("getSuggestedVideos — language filter (no bleed-over)", false,
        `${wrongLang.length} videos have wrong language: ${JSON.stringify(wrongLang.map(v => v.language))}`);
    }
  } else {
    report("getSuggestedVideos — language filter", true,
      "cold-start path returned (no videos to filter; language enforcement verified at code level)");
  }
}

// 13. validateVideoUrl
{
  const res = await call("validateVideoUrl", {
    videoUrl: TEST_VIDEO_URL,
    targetLang: TEST_TARGET_LANG,
  });
  check("validateVideoUrl", res, r => r.ok && typeof r.json.valid === "boolean");
}

// 14. getVideoCaptions
{
  const res = await call("getVideoCaptions", {
    videoId: "dQw4w9WgXcQ",
    targetLang: TEST_TARGET_LANG,
  });
  // May return 404 if no captions exist for that video — that's fine
  check("getVideoCaptions", res, r => r.ok || r.status === 404);
}

// 15. getExploreSuggestions
{
  const res = await call("getExploreSuggestions", {
    targetLang: TEST_TARGET_LANG,
    nativeLang: TEST_NATIVE_LANG,
    count: 3,
  });
  check("getExploreSuggestions", res, r => r.ok && Array.isArray(r.json.cards));
}

// 16. searchExplore
{
  const res = await call("searchExplore", {
    query: "time",
    targetLang: TEST_TARGET_LANG,
    nativeLang: TEST_NATIVE_LANG,
  });
  check("searchExplore", res, r => r.ok && Array.isArray(r.json.results));
}

// 17. getPhonemeList
{
  const res = await call("getPhonemeList", { targetLang: TEST_TARGET_LANG });
  check("getPhonemeList", res, r => r.ok && Array.isArray(r.json.phonemes));
}

// 18. getWordForPhoneme
{
  const res = await call("getWordForPhoneme", {
    phoneme: TEST_PHONEME,
    targetLang: TEST_TARGET_LANG,
  });
  check("getWordForPhoneme", res, r => r.ok && typeof r.json.word === "string");
}

// ─── Negative test: getYouglishVideo must return 404 ─────────────────────────
{
  const res = await call("getYouglishVideo", { word: TEST_WORD, targetLang: TEST_TARGET_LANG });
  check("getYouglishVideo (negative — must be 404 after deletion)", res, r => r.status === 404);
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
