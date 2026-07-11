-- ============================================================
-- Migration 006: Add current_mcq cache column to review_queue
-- ============================================================
-- Stores the raw Gemini-generated question JSON so that
-- getMasterySession can serve the same question on repeated
-- page loads without re-calling the Gemini API.
-- The column is cleared (set to NULL) by submitAnswer so the
-- next review cycle always gets a freshly generated question.

ALTER TABLE review_queue
  ADD COLUMN IF NOT EXISTS current_mcq JSONB DEFAULT NULL;
