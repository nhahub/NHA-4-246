-- ============================================================
-- Migration 005: Grant DML privileges to authenticated and anon roles
-- RLS policies alone are not enough — Postgres requires explicit
-- table-level grants before RLS is even evaluated.
-- ============================================================

grant select, insert, update, delete
  on table public.profiles
  to authenticated, anon;

grant select, insert, update, delete
  on table public.words
  to authenticated, anon;

grant select, insert, update, delete
  on table public.word_contexts
  to authenticated, anon;

grant select, insert, update, delete
  on table public.review_queue
  to authenticated, anon;

grant select, insert, update, delete
  on table public.review_history
  to authenticated, anon;

grant select, insert, update, delete
  on table public.watch_history
  to authenticated, anon;

grant select, insert, update, delete
  on table public.watch_session_words
  to authenticated, anon;

grant select, insert, update, delete
  on table public.phoneme_assessments
  to authenticated, anon;
