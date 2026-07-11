// ─── Canonical Category Normalizer ────────────────────────────────────────────
// Maps a free-text search query to one of 16 fixed canonical categories using
// keyword matching.  Pure, synchronous, zero external dependencies.
//
// Usage:
//   import { normalizeCategory, CANONICAL_CATEGORIES } from "./normalizeCategory.ts";
//   const cat = normalizeCategory("ancient rome documentary");  // → "history"

export const CANONICAL_CATEGORIES = [
  "history",
  "science",
  "technology",
  "business",
  "health",
  "self-development",
  "travel",
  "cooking",
  "sports",
  "entertainment",
  "education",
  "nature",
  "art",
  "philosophy",
  "politics",
  "other",
] as const;

export type CanonicalCategory = (typeof CANONICAL_CATEGORIES)[number];

// ── Keyword → Category map ───────────────────────────────────────────────────
// Each entry is [category, keywords[]].  Keywords are matched as whole words
// (word-boundary regex) against the lowercased query.  Order matters: first
// match wins, so more-specific categories should come before broader ones.

const KEYWORD_MAP: Array<[CanonicalCategory, string[]]> = [
  ["history", [
    "history", "historical", "ancient", "medieval", "empire", "dynasty",
    "century", "civilization", "civilisation", "war", "battle", "revolution",
    "colonial", "prehistoric", "archaeology", "archeology", "pharaoh",
    "roman", "greek", "ottoman", "byzantine", "renaissance", "viking",
    "crusade", "monarchy", "kingdom",
  ]],
  ["science", [
    "science", "scientific", "physics", "biology", "chemistry", "experiment",
    "atom", "molecule", "evolution", "quantum", "neuroscience", "astronomy",
    "genetics", "dna", "cell", "theory", "hypothesis", "laboratory",
    "microscope", "telescope",
  ]],
  ["technology", [
    "technology", "tech", "programming", "coding", "computer", "software",
    "hardware", "ai", "artificial intelligence", "machine learning", "robot",
    "robotics", "digital", "cyber", "internet", "app", "startup tech",
    "blockchain", "algorithm", "data science",
  ]],
  ["business", [
    "business", "economy", "economic", "finance", "financial", "money",
    "market", "invest", "investment", "startup", "entrepreneur",
    "entrepreneurship", "corporate", "company", "stock", "trade", "trading",
    "capitalism", "bank", "banking", "accounting", "management",
  ]],
  ["health", [
    "health", "healthy", "medical", "medicine", "fitness", "nutrition",
    "exercise", "wellness", "disease", "mental health", "therapy",
    "psychology", "diet", "vitamin", "immune", "hospital", "doctor",
    "anxiety", "depression", "meditation", "yoga", "mindfulness",
  ]],
  ["self-development", [
    "self improvement", "self-improvement", "self development",
    "self-development", "motivation", "motivational", "productivity",
    "mindset", "habits", "personal growth", "success", "discipline",
    "confidence", "leadership", "goal setting", "time management",
    "procrastination", "resilience", "stoic", "stoicism",
  ]],
  ["travel", [
    "travel", "traveling", "travelling", "tourism", "tourist", "adventure",
    "destination", "backpack", "backpacking", "explore world", "country",
    "countries", "city", "cities", "culture", "cultural", "abroad",
    "vacation", "holiday", "flight", "passport", "nomad",
  ]],
  ["cooking", [
    "cooking", "cook", "recipe", "recipes", "food", "cuisine", "chef",
    "baking", "bake", "kitchen", "meal", "restaurant", "dish", "ingredient",
    "ingredients", "culinary", "gourmet", "delicious", "flavor", "flavour",
  ]],
  ["sports", [
    "sport", "sports", "football", "soccer", "basketball", "tennis",
    "baseball", "cricket", "rugby", "athlete", "athletic", "workout",
    "olympic", "olympics", "championship", "league", "match", "team",
    "swimming", "running", "marathon", "boxing", "martial arts",
  ]],
  ["entertainment", [
    "movie", "movies", "film", "films", "music", "musician", "celebrity",
    "comedy", "comedian", "drama", "show", "tv show", "series", "gaming",
    "game", "games", "anime", "manga", "netflix", "hollywood", "bollywood",
    "pop culture", "concert", "album", "singer", "actor", "actress",
  ]],
  ["education", [
    "education", "educational", "learn", "learning", "study", "studying",
    "school", "university", "college", "lecture", "lesson", "tutorial",
    "teaching", "teacher", "exam", "test", "course", "classroom",
    "student", "academic", "curriculum", "language learning",
    "english lesson", "french lesson", "vocabulary",
  ]],
  ["nature", [
    "nature", "natural", "animal", "animals", "wildlife", "ocean", "sea",
    "forest", "jungle", "climate", "weather", "environment", "environmental",
    "planet", "ecology", "ecological", "marine", "earth", "ecosystem",
    "endangered", "species", "bird", "insect", "reptile", "mammal",
    "conservation", "sustainability",
  ]],
  ["art", [
    "art", "artist", "artistic", "painting", "design", "museum", "gallery",
    "creative", "creativity", "photography", "photographer", "architecture",
    "sculpture", "drawing", "illustration", "aesthetic", "contemporary art",
    "modern art", "canvas", "exhibition",
  ]],
  ["philosophy", [
    "philosophy", "philosophical", "ethics", "ethical", "meaning",
    "existence", "existential", "logic", "logical", "moral", "morality",
    "consciousness", "metaphysics", "epistemology", "ontology", "socrates",
    "plato", "aristotle", "nietzsche", "kant", "descartes",
  ]],
  ["politics", [
    "politics", "political", "government", "democracy", "democratic",
    "election", "elections", "policy", "law", "legal", "diplomacy",
    "diplomatic", "debate", "geopolitics", "geopolitical", "president",
    "congress", "parliament", "senate", "legislation", "constitution",
    "vote", "voting", "campaign",
  ]],
];

// Pre-compile regex patterns for each category.
// Each keyword is escaped and wrapped in word-boundary anchors.
const COMPILED_PATTERNS: Array<[CanonicalCategory, RegExp]> = KEYWORD_MAP.map(
  ([category, keywords]) => {
    // Escape special regex characters in keywords, then join with |.
    const escaped = keywords.map((kw) =>
      kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    // Use \b word-boundary so "art" doesn't match "start" or "party".
    const pattern = new RegExp(`\\b(?:${escaped.join("|")})\\b`, "i");
    return [category, pattern];
  }
);

/**
 * Map a free-text search query to one of the 16 canonical categories.
 *
 * - Lowercases the query and matches against keyword patterns.
 * - Returns the first matching category (order is intentional — more
 *   specific categories are checked before broader ones).
 * - Falls back to `"other"` if no keyword matches.
 */
export function normalizeCategory(query: string): CanonicalCategory {
  if (!query || !query.trim()) return "other";

  const lower = query.toLowerCase().trim();

  for (const [category, pattern] of COMPILED_PATTERNS) {
    if (pattern.test(lower)) return category;
  }

  return "other";
}

/**
 * Normalize an array of raw category strings, deduplicating the results.
 * Useful for backfilling existing `watch_history.categories` arrays.
 */
export function normalizeCategories(raw: string[]): string[] {
  const normalized = new Set(raw.map(normalizeCategory));
  return [...normalized];
}
