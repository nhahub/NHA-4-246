-- ============================================================
-- Migration 001: Core schema, indexes, RLS
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  native_language  text not null,
  target_language  text not null check (target_language in ('en','fr')),
  onboarded        boolean default false,
  created_at       timestamptz default now()
);

alter table profiles enable row level security;
create policy "users manage own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ── words ─────────────────────────────────────────────────────
create table words (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  headword        text not null,
  native_synonyms text[] not null,
  stage           int  not null default 1 check (stage between 1 and 6),
  stage6_streak   int  not null default 0,
  active          boolean not null default true,
  source          text not null check (source in ('manual','watch','explore','selection')),
  saved_at        timestamptz not null default now(),
  mastered_at     timestamptz
);

create index idx_words_user_saved   on words (user_id, saved_at);
create index idx_words_user_active  on words (user_id, active);

alter table words enable row level security;
create policy "users manage own words" on words
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── word_contexts ──────────────────────────────────────────────
create table word_contexts (
  id          uuid primary key default gen_random_uuid(),
  word_id     uuid not null references words(id) on delete cascade,
  label       text not null,
  explanation text not null,
  example     text not null,
  sort_order  int  not null default 0
);

alter table word_contexts enable row level security;
create policy "users manage own contexts" on word_contexts
  for all using (
    exists (select 1 from words w where w.id = word_contexts.word_id and w.user_id = auth.uid())
  );

-- ── review_queue ───────────────────────────────────────────────
create table review_queue (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  word_id        uuid not null references words(id) on delete cascade,
  scheduled_for  timestamptz not null,
  question_type  int  not null check (question_type between 1 and 6),
  status         text not null default 'pending'
                   check (status in ('pending','completed','skipped')),
  created_at     timestamptz default now()
);

create index idx_review_queue_hot on review_queue (user_id, status, scheduled_for);

alter table review_queue enable row level security;
create policy "users manage own review_queue" on review_queue
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── review_history ─────────────────────────────────────────────
create table review_history (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  word_id       uuid not null references words(id) on delete cascade,
  review_id     uuid references review_queue(id),
  is_correct    boolean not null,
  stage_before  int not null,
  stage_after   int not null,
  answered_at   timestamptz default now()
);

alter table review_history enable row level security;
create policy "users manage own review_history" on review_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── watch_history ──────────────────────────────────────────────
create table watch_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  video_id    text not null,
  categories  text[],
  watched_at  timestamptz default now()
);

alter table watch_history enable row level security;
create policy "users manage own watch_history" on watch_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── watch_session_words ────────────────────────────────────────
create table watch_session_words (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  video_id  text not null,
  word_id   uuid not null references words(id) on delete cascade,
  saved_at  timestamptz default now()
);

alter table watch_session_words enable row level security;
create policy "users manage own watch_session_words" on watch_session_words
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── phoneme_assessments ────────────────────────────────────────
create table phoneme_assessments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  target_language  text not null,
  phoneme          text not null,
  status           text not null check (status in ('excellent','good','wrong')),
  attempts         int  not null default 0,
  last_assessed_at timestamptz default now(),
  unique (user_id, target_language, phoneme)
);

alter table phoneme_assessments enable row level security;
create policy "users manage own phoneme_assessments" on phoneme_assessments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
