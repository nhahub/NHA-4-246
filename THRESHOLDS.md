# Thresholds & Constants

All values below were NOT explicitly specified in the product spec and were chosen by the backend implementer. Each should be reviewed and tuned as real usage data comes in.

---

## Spaced Repetition

| Constant | Value | Note |
|---|---|---|
| `DAILY_REVIEW_CAP` | 50 | Already specified in spec; listed here for discoverability |
| Queue delays | 3h / 1d / 3d / 1w / 3w / 2mo | Specified in spec |

---

## Levenshtein Typo Tolerance (submitAnswer — types 3, 4, 6)

Applied to `isTypoTolerantMatch` in `_shared/levenshtein.ts`:

| Word length | Max distance | Rationale |
|---|---|---|
| ≤ 4 chars | 1 | Short words tolerate only a single-char slip |
| 5–8 chars | 2 | Mid-length words allow transposition or one missing letter |
| > 8 chars | 3 | Long words/phrases allow up to 3-char deviation |

These values err on the lenient side. Tighten if users exploit them to pass with clearly wrong answers.

---

## Phoneme Status Buckets (assessPronunciation)

SpeechSuper returns a 0–100 pronunciation score per phoneme:

| Score range | Assigned status |
|---|---|
| ≥ 80 | `excellent` |
| 50–79 | `good` |
| < 50 | `wrong` |

Adjust if SpeechSuper's scoring distribution turns out to be skewed for a specific language.

---

## Explore Feature

| Constant | Value | Note |
|---|---|---|
| `SAMPLE_SIZE` | 20 | Number of recent vault words fetched as seed candidates |
| `SEED_COUNT` | 3 | Number of seeds passed to Gemini for suggestion generation |
| `OUTPUT_COUNT` | 5 | Number of explore cards generated per refresh |

---

## Watch — Recommendation

| Constant | Value | Note |
|---|---|---|
| `COLD_START_THRESHOLD` | 5 | Minimum watch history entries before personalization kicks in |
| `EXPLORE_RATIO` | 0.2 (20%) | Fraction of suggestions from outside the user's usual categories |

**IMPORTANT:** The original product spec references a previously-defined personalization algorithm that was not included in the backend prompt. The current implementation (category-frequency ranking + exploration injection) is a reasonable approximation. Replace with the exact intended algorithm when it is provided.

---

## Rate Limits (per-user, per-isolate)

These are in-memory limits (reset on cold start). Replace with a Redis-backed counter for production.

| Endpoint | Max calls | Window |
|---|---|---|
| `generateDetailCard` | 30 | 60 s |
| `generateVaultParagraph` | 15 | 60 s |
| `getExploreSuggestions` | 10 | 60 s |
| All others | 20 (default) | 60 s |

---

## Vault Read Paragraph

| Constant | Value | Note |
|---|---|---|
| Max paragraph length | 200 words | Specified in spec (passed in Gemini prompt) |
| Retry attempts | 2 | On empty/invalid Gemini response, retries once with a smaller word subset |

---

## Gemini Model

| Setting | Value |
|---|---|
| Model | `gemini-1.5-flash` |
| Default timeout | 30 000 ms |
| JSON mode | Enabled for all structured outputs |

Switch to `gemini-1.5-pro` for higher accuracy on nuanced-usage grading (type 5) if quality is insufficient.
