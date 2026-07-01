// ─── Mock Service Layer ───────────────────────────────────────────────────────
// INTEGRATION POINTS: Replace each function body with a real Supabase/edge-function
// call. Function signatures MUST NOT change — the entire UI depends on them.
// See README.md for the full list of integration points.

import {
  DetailCardData,
  ReviewItem,
  VaultWord,
  VideoItem,
  CaptionLine,
  PhonemeStatus,
  PronunciationResult,
  GenerateDetailCardResult,
  GetSuggestedVideosResult,
  GetExploreSuggestionsResult,
  SearchExploreResult,
  GenerateVaultParagraphResult,
} from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function delay(min = 300, max = 800): Promise<void> {
  return new Promise(res => setTimeout(res, Math.random() * (max - min) + min));
}

/** Randomly throw ~10% of the time to test error states */
function maybeThrow(): void {
  if (Math.random() < 0.08) {
    throw new Error('Service currently busy. Please try again.');
  }
}

let wordIdCounter = 100;
function newId(): string {
  return `word-${++wordIdCounter}-${Date.now()}`;
}

// ─── Seed mock data ───────────────────────────────────────────────────────────

const MOCK_CARDS: DetailCardData[] = [
  {
    id: 'word-1',
    headword: 'ephemeral',
    synonyms: ['éphémère', 'fugace', 'transitoire'],
    contexts: [
      {
        label: 'General',
        explanation: 'Lasting for a very short time; transient.',
        example: 'The _ephemeral_ beauty of cherry blossoms makes them all the more precious.',
      },
      {
        label: 'Figurative',
        explanation: 'Describes moments or feelings that quickly pass.',
        example: 'Fame can be _ephemeral_ — here today and forgotten tomorrow.',
      },
    ],
    stage: 2, stage6_streak: 0, active: true, savedAt: '2026-05-15T10:00:00Z', source: 'explore',
    nativeTranslation: 'éphémère',
  },
  {
    id: 'word-2',
    headword: 'serendipity',
    synonyms: ['sérendipité', 'chance heureuse', 'bonne fortune'],
    contexts: [
      {
        label: 'General',
        explanation: 'The occurrence of happy accidents or pleasant surprises.',
        example: 'Finding my best friend was pure _serendipity_ — we were both reaching for the same book.',
      },
    ],
    stage: 1, stage6_streak: 0, active: true, savedAt: '2026-05-20T14:00:00Z', source: 'watch',
    nativeTranslation: 'sérendipité',
  },
  {
    id: 'word-3',
    headword: 'resilient',
    synonyms: ['résilient', 'robuste', 'tenace'],
    contexts: [
      {
        label: 'Personal quality',
        explanation: 'Able to recover quickly from difficulties; tough.',
        example: 'She remained _resilient_ despite the repeated setbacks in her career.',
      },
      {
        label: 'Materials',
        explanation: 'Able to recoil or spring back into shape after bending.',
        example: 'The _resilient_ material bounced back to its original form.',
      },
    ],
    stage: 3, stage6_streak: 0, active: true, savedAt: '2026-06-01T09:00:00Z', source: 'manual',
    nativeTranslation: 'résilient',
  },
  {
    id: 'word-4',
    headword: 'ubiquitous',
    synonyms: ['omniprésent', 'universel', 'répandu'],
    contexts: [
      {
        label: 'General',
        explanation: 'Present, appearing, or found everywhere.',
        example: 'Smartphones have become so _ubiquitous_ that life without one feels impossible.',
      },
    ],
    stage: 0, stage6_streak: 0, active: true, savedAt: '2026-06-10T16:00:00Z', source: 'selection',
    nativeTranslation: 'omniprésent',
  },
  {
    id: 'word-5',
    headword: 'melancholy',
    synonyms: ['mélancolie', 'tristesse douce', 'nostalgie'],
    contexts: [
      {
        label: 'Emotional state',
        explanation: 'A feeling of pensive sadness, typically with no obvious cause.',
        example: 'A sense of _melancholy_ swept over him as he looked at old photographs.',
      },
      {
        label: 'Literary',
        explanation: 'Used to describe a pervasive mood or atmosphere in writing.',
        example: 'The novel is drenched in _melancholy_, reflecting the author\'s own losses.',
      },
    ],
    stage: 4, stage6_streak: 0, active: true, savedAt: '2026-04-05T11:00:00Z', source: 'explore',
    nativeTranslation: 'mélancolie',
  },
];

const MOCK_VIDEOS: VideoItem[] = [
  {
    videoId: 'dQw4w9WgXcQ',
    title: 'Advanced English Vocabulary — Academic Words',
    channelName: 'English with Lucy',
    thumbnailUrl: `https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg`,
    duration: '14:32',
    category: 'education',
    language: 'en',
  },
  {
    videoId: 'ZZ5LpwO-An4',
    title: 'TED Talk: The Power of Words',
    channelName: 'TED',
    thumbnailUrl: `https://img.youtube.com/vi/ZZ5LpwO-An4/hqdefault.jpg`,
    duration: '18:04',
    category: 'talks',
    language: 'en',
  },
  {
    videoId: 'kJQP7kiw5Fk',
    title: 'Apprendre le français — Vocabulaire courant',
    channelName: 'Français avec Pierre',
    thumbnailUrl: `https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg`,
    duration: '22:10',
    category: 'education',
    language: 'fr',
  },
  {
    videoId: 'OPf0YbXqDm0',
    title: 'BBC Documentary — Nature & Language',
    channelName: 'BBC Earth',
    thumbnailUrl: `https://img.youtube.com/vi/OPf0YbXqDm0/hqdefault.jpg`,
    duration: '09:55',
    category: 'documentary',
    language: 'en',
  },
];

const MOCK_PHONEMES: PhonemeStatus[] = [
  { phoneme: '/θ/', status: 'wrong' },
  { phoneme: '/ð/', status: 'wrong' },
  { phoneme: '/ɪ/', status: 'good' },
  { phoneme: '/æ/', status: 'good' },
  { phoneme: '/ʌ/', status: 'good' },
  { phoneme: '/ɑː/', status: 'excellent' },
  { phoneme: '/iː/', status: 'excellent' },
  { phoneme: '/p/', status: 'excellent' },
  { phoneme: '/b/', status: 'excellent' },
  { phoneme: '/t/', status: 'excellent' },
  { phoneme: '/d/', status: 'excellent' },
  { phoneme: '/k/', status: 'excellent' },
  { phoneme: '/ɒ/', status: 'good' },
  { phoneme: '/uː/', status: 'good' },
  { phoneme: '/ʃ/', status: 'wrong' },
];

const MOCK_CAPTIONS: CaptionLine[] = [
  { startMs: 0,     endMs: 3200,  text: 'Welcome to this fascinating lesson on advanced English vocabulary.' },
  { startMs: 3200,  endMs: 7000,  text: 'Today we\'ll explore words that are both ephemeral and profound.' },
  { startMs: 7000,  endMs: 11500, text: 'Our first word is "serendipity" — the happy accident of discovery.' },
  { startMs: 11500, endMs: 15000, text: 'Think about moments when something unexpected changed your life.' },
  { startMs: 15000, endMs: 19000, text: 'A resilient person bounces back from adversity with renewed strength.' },
  { startMs: 19000, endMs: 24000, text: 'In today\'s ubiquitous digital age, resilience is more important than ever.' },
  { startMs: 24000, endMs: 29000, text: 'Let\'s look at the word "melancholy" — a bittersweet form of sadness.' },
  { startMs: 29000, endMs: 33000, text: 'The melancholy beauty of autumn leaves inspires poets worldwide.' },
  { startMs: 33000, endMs: 38000, text: 'Now try selecting any word you don\'t know — tap the bee icon to look it up!' },
];

// ─── Locally tracked saved words (in-memory, simulating a database) ──────────
const savedWordIds = new Set<string>(['word-1', 'word-2', 'word-3', 'word-4', 'word-5']);

// ─── API Implementation ───────────────────────────────────────────────────────

/** INTEGRATION POINT: Replace with Supabase edge function call */
export async function generateDetailCard(input: {
  text: string;
  nativeLang: string;
  targetLang: string;
}): Promise<GenerateDetailCardResult> {
  await delay(600, 1200);
  maybeThrow();

  const headword = input.text.trim();
  const wordCount = headword.split(/\s+/).length;
  if (wordCount > 50) {
    return { mode: 'too_long', card: null };
  }

  // Simulate simplified mode for longer multi-word phrases (3+ words)
  if (wordCount >= 3 && Math.random() < 0.4) {
    const simplified: DetailCardData = {
      id: newId(),
      headword,
      synonyms: [],
      contexts: [],
      stage: 0, stage6_streak: 0, active: true,
      nativeTranslation: `[Translation of "${headword}"]`,
      source: 'selection',
    };
    return { mode: 'simplified', card: simplified };
  }

  // Try to find a matching seed card (exact or partial match on headword)
  const exactMatch = MOCK_CARDS.find(
    c => c.headword.toLowerCase() === headword.toLowerCase()
  );
  const seed = exactMatch ?? MOCK_CARDS[Math.floor(Math.random() * MOCK_CARDS.length)];

  // Build a card whose headword IS the searched text; keep contexts/synonyms
  // coherent by scaling the seed's examples to use the real headword
  const updatedContexts = seed.contexts.map(ctx => ({
    ...ctx,
    example: ctx.example.replace(
      new RegExp(`_${seed.headword}_`, 'gi'),
      `_${headword}_`
    ),
  }));

  const card: DetailCardData = {
    ...seed,
    id: newId(),
    headword,
    contexts: exactMatch ? seed.contexts : updatedContexts,
    source: 'selection',
    savedAt: undefined,
  };
  return { mode: 'full', card };
}

/** INTEGRATION POINT: Replace with Supabase edge function call */
export async function checkTypos(input: { text: string }): Promise<{
  hasTypos: boolean;
  suggestion?: string;
}> {
  await delay(300, 600);
  // Simulate typo detection — trigger on very short all-lowercase with common patterns
  const text = input.text;
  if (text === 'ephemral') return { hasTypos: true, suggestion: 'ephemeral' };
  if (text === 'serendippity') return { hasTypos: true, suggestion: 'serendipity' };
  if (text === 'resillent') return { hasTypos: true, suggestion: 'resilient' };
  // Randomly flag 5% of inputs to make it testable
  if (Math.random() < 0.05) {
    return { hasTypos: true, suggestion: `${text}s` };
  }
  return { hasTypos: false };
}

/** INTEGRATION POINT: Replace with Supabase edge function call */
export async function translateExplanations(input: {
  explanations: string[];
  nativeLang: string;
}): Promise<{ translated: string[] }> {
  await delay(400, 800);
  maybeThrow();
  const translated = input.explanations.map(
    exp => `[${input.nativeLang}] ${exp}`
  );
  return { translated };
}

/** INTEGRATION POINT: Replace with YouGlish API or Supabase edge function */
export async function getYouglishVideo(input: {
  word: string;
  targetLang: string;
}): Promise<{ videoUrl: string | null }> {
  await delay(400, 700);
  // Return null ~20% of the time to test empty state
  if (Math.random() < 0.2) return { videoUrl: null };
  const videoIds = ['dQw4w9WgXcQ', 'ZZ5LpwO-An4', 'kJQP7kiw5Fk'];
  const id = videoIds[Math.floor(Math.random() * videoIds.length)];
  return { videoUrl: `https://www.youtube.com/embed/${id}` };
}

/** INTEGRATION POINT: Replace with SpeechSuper API call via Supabase edge function */
export async function assessPronunciation(input: {
  audioBlob: Blob;
  word: string;
  targetLang: string;
}): Promise<PronunciationResult> {
  await delay(800, 1500);
  maybeThrow();
  const score = Math.floor(Math.random() * 40) + 55; // 55–94
  const phonemes = input.word
    .toLowerCase()
    .split('')
    .filter(c => /[a-z]/.test(c))
    .slice(0, 5)
    .map(c => ({
      phoneme: `/${c}/`,
      status: (score > 80 ? 'excellent' : score > 60 ? 'good' : 'wrong') as 'excellent' | 'good' | 'wrong',
    }));
  return { score, phonemeBreakdown: phonemes };
}

/** INTEGRATION POINT: Replace with Supabase insert */
export async function saveWord(input: {
  word: DetailCardData;
  source: 'manual' | 'watch' | 'explore' | 'selection';
}): Promise<{ wordId: string }> {
  await delay(300, 500);
  savedWordIds.add(input.word.id);
  return { wordId: input.word.id };
}

/** INTEGRATION POINT: Replace with Supabase delete */
export async function removeWord(input: { wordId: string }): Promise<{ success: boolean }> {
  await delay(300, 500);
  savedWordIds.delete(input.wordId);
  return { success: true };
}

/** INTEGRATION POINT: Replace with Supabase query + SRS logic */
export async function getMasterySession(): Promise<{
  queue: ReviewItem[];
  totalToday: number;
}> {
  await delay(400, 800);
  const queue: ReviewItem[] = MOCK_CARDS.slice(0, 5).map((card, i) => {
    const types: (1 | 2 | 3 | 4 | 5 | 6)[] = [1, 2, 4, 5, 6, 3];
    const qType = types[i % types.length];
    return {
      reviewId: `review-${i}-${Date.now()}`,
      wordId: card.id,
      headword: card.headword,
      questionType: qType,
      mcqOptions: qType === 1 ? [
        card.contexts[0]?.explanation || 'Definition A',
        'A completely different meaning',
        'An unrelated concept',
        'Something else entirely',
      ] : undefined,
      correctOption: qType === 1 ? (card.contexts[0]?.explanation || 'Definition A') : undefined,
      reversedDefinition: qType === 2 ? card.contexts[0]?.explanation : undefined,
      reversedOptions: qType === 2 ? [card.headword, 'serendipity', 'resilient', 'ubiquitous'] : undefined,
      fillSentence: qType === 4 ? card.contexts[0]?.example?.replace(
        new RegExp(`_${card.headword}_`, 'i'), '___'
      ) : undefined,
      nuancedPrompt: qType === 5 ? `Write a sentence using "${card.headword}" in a nuanced context.` : undefined,
      productionPrompt: qType === 6 ? `Write your own sentence using "${card.headword}".` : undefined,
      cardData: card,
    };
  });
  return { queue, totalToday: 12 };
}

/** INTEGRATION POINT: Replace with Supabase SRS update */
export async function submitAnswer(input: {
  wordId: string;
  reviewId: string;
  userAnswer: string;
  questionType: number;
}): Promise<{ isCorrect: boolean; newStage: number }> {
  await delay(300, 600);
  // Simple mock: correct if answer is non-empty and longer than 2 chars
  const isCorrect = input.userAnswer.trim().length > 2 && Math.random() > 0.35;
  return { isCorrect, newStage: isCorrect ? 2 : 1 };
}

/** INTEGRATION POINT: Replace with Supabase query */
export async function getVaultMonths(): Promise<{ month: string; wordCount: number }[]> {
  await delay(300, 600);
  return [
    { month: '2026-06', wordCount: 2 },
    { month: '2026-05', wordCount: 2 },
    { month: '2026-04', wordCount: 1 },
  ];
}

/** INTEGRATION POINT: Replace with Supabase query */
export async function getVaultWords(month: string): Promise<VaultWord[]> {
  await delay(300, 700);
  const allWords: VaultWord[] = MOCK_CARDS.map(card => ({
    id: card.id,
    headword: card.headword,
    nativeTranslation: card.nativeTranslation || card.synonyms[0] || '',
    savedAt: card.savedAt || new Date().toISOString(),
    stage: card.stage,
    cardData: card,
  }));
  // Filter by month
  return allWords.filter(w => w.savedAt.startsWith(month));
}

/** INTEGRATION POINT: Replace with Gemini edge function call */
export async function generateVaultParagraph(input: {
  month: string;
  excludeWordIds: string[];
}): Promise<GenerateVaultParagraphResult> {
  await delay(700, 1400);
  maybeThrow();
  const availableWords = MOCK_CARDS.filter(c => !input.excludeWordIds.includes(c.id));
  if (availableWords.length === 0) {
    return { error: 'No more words available to generate a paragraph.' };
  }
  const picked = availableWords.slice(0, Math.min(3, availableWords.length));
  const pickedWordIds = picked.map(w => w.id);
  const paragraph =
    `In the ${input.month} of her travels, Maria discovered how ${picked[0]?.headword || 'ephemeral'} beauty can be. ` +
    `Every city she visited held a touch of ${picked[1]?.headword || 'serendipity'}, bringing unexpected joy. ` +
    `Despite the challenges, she remained ${picked[2]?.headword || 'resilient'}, pressing forward with quiet determination. ` +
    `Her journal overflowed with observations — proof that language is never ${picked[0]?.headword || 'ephemeral'}, even when moments are.`;
  return { paragraph, pickedWordIds };
}

/** INTEGRATION POINT: Replace with recommendation engine query */
export async function getSuggestedVideos(): Promise<GetSuggestedVideosResult> {
  await delay(400, 800);
  maybeThrow();
  // Simulate cold start ~15% of the time
  if (Math.random() < 0.15) {
    return {
      promptMessage:
        'Watch a few videos first and we\'ll suggest content based on your vocabulary interests!',
    };
  }
  return { videos: MOCK_VIDEOS };
}

/** INTEGRATION POINT: Replace with YouTube Data API validation */
export async function validateVideoUrl(input: { url: string }): Promise<{
  valid: boolean;
  reason?: string;
}> {
  await delay(300, 600);
  const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;
  if (!ytRegex.test(input.url)) {
    return { valid: false, reason: 'Not a valid YouTube URL.' };
  }
  // Simulate language check — 20% chance of wrong language
  if (Math.random() < 0.2) {
    return { valid: false, reason: 'This video is not in your target language.' };
  }
  return { valid: true };
}

/** INTEGRATION POINT: Replace with YouTube Captions API / subtitle fetch */
export async function getVideoCaptions(videoId: string): Promise<{ captions: CaptionLine[] }> {
  await delay(400, 900);
  return { captions: MOCK_CAPTIONS };
}

/** INTEGRATION POINT: Replace with Gemini edge function call */
export async function getExploreSuggestions(): Promise<GetExploreSuggestionsResult> {
  await delay(500, 1000);
  maybeThrow();
  // Simulate empty state ~10% of the time
  if (Math.random() < 0.1) {
    return { emptyMessage: 'Save some words first and we\'ll suggest new vocabulary you might love!' };
  }
  const shuffled = [...MOCK_CARDS].sort(() => Math.random() - 0.5);
  return { cards: shuffled.slice(0, 5) };
}

/** INTEGRATION POINT: Replace with Gemini search edge function */
export async function searchExplore(input: {
  query: string;
  lang: 'native' | 'target';
}): Promise<SearchExploreResult> {
  await delay(500, 900);
  maybeThrow();
  // Simulate safety error for certain keywords
  const safetyKeywords = ['violence', 'hate', 'illegal', 'weapon'];
  if (safetyKeywords.some(k => input.query.toLowerCase().includes(k))) {
    return { safetyError: true };
  }
  const results = MOCK_CARDS.filter(c =>
    c.headword.toLowerCase().includes(input.query.toLowerCase()) ||
    c.contexts.some(ctx => ctx.explanation.toLowerCase().includes(input.query.toLowerCase()))
  );
  return { cards: results.length > 0 ? results : MOCK_CARDS.slice(0, 3) };
}

/** INTEGRATION POINT: Replace with Supabase query */
export async function getPhonemeList(): Promise<PhonemeStatus[]> {
  await delay(300, 600);
  // Order: excellent first, then good, then wrong
  return [...MOCK_PHONEMES].sort((a, b) => {
    const order = { excellent: 0, good: 1, wrong: 2 };
    return order[a.status] - order[b.status];
  });
}

/** INTEGRATION POINT: Replace with Supabase/Gemini word lookup */
export async function getWordForPhoneme(phoneme: string): Promise<{ word: string }> {
  await delay(300, 600);
  const phonemeWordMap: Record<string, string> = {
    '/θ/': 'think',
    '/ð/': 'this',
    '/ɪ/': 'bit',
    '/æ/': 'cat',
    '/ʌ/': 'cup',
    '/ɑː/': 'car',
    '/iː/': 'see',
    '/p/': 'pen',
    '/b/': 'bed',
    '/t/': 'top',
    '/d/': 'dog',
    '/k/': 'key',
    '/ɒ/': 'got',
    '/uː/': 'blue',
    '/ʃ/': 'shoe',
  };
  return { word: phonemeWordMap[phoneme] || 'threshold' };
}
