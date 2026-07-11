-- ============================================================
-- Migration 007: Video captions cache table
-- ============================================================
-- Stores scraped YouTube caption data keyed by (video_id, language)
-- to reduce load on the fragile watch-page scraping path.
-- Accessed via service-role client from edge functions.

CREATE TABLE video_captions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id   TEXT NOT NULL,
  language   TEXT NOT NULL,
  captions   JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (video_id, language)
);

-- Service-role needs explicit DML grants in Supabase's Postgres.
-- No authenticated/anon grants — this is an internal cache table
-- accessed only via getServiceClient() in edge functions.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.video_captions
  TO service_role;
