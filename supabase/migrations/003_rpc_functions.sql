-- ============================================================
-- Migration 003: Spaced-repetition Postgres RPC functions
-- ============================================================

-- ── schedule_review ────────────────────────────────────────────
-- Inserts one review_queue row for the given word based on its current stage.
-- Called after SaveWord and after each OnAnswer.
create or replace function schedule_review(p_word_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_word        words%rowtype;
  v_delay       interval;
  v_qtype       int;
begin
  select * into v_word from words where id = p_word_id;
  if not found then
    raise exception 'word not found: %', p_word_id;
  end if;

  -- Delay intervals per stage
  v_delay := case v_word.stage
    when 1 then interval '3 hours'
    when 2 then interval '1 day'
    when 3 then interval '3 days'
    when 4 then interval '1 week'
    when 5 then interval '3 weeks'
    when 6 then interval '2 months'
    else        interval '1 day'
  end;

  -- Question type mirrors the stage number exactly
  v_qtype := v_word.stage;

  insert into review_queue (user_id, word_id, scheduled_for, question_type, status)
  values (v_word.user_id, p_word_id, now() + v_delay, v_qtype, 'pending');
end;
$$;

-- ── on_answer ──────────────────────────────────────────────────
-- Processes one answered review item transactionally:
--   1. Updates words.stage / stage6_streak / active / mastered_at
--   2. Marks the review_queue row as completed
--   3. Inserts review_history row
--   4. Schedules next review (unless word is now mastered)
-- Returns (is_correct boolean, new_stage int)
create or replace function on_answer(
  p_review_id   uuid,
  p_word_id     uuid,
  p_is_correct  boolean
)
returns table(is_correct boolean, new_stage int)
language plpgsql
security definer
as $$
declare
  v_word         words%rowtype;
  v_stage_before int;
  v_stage_after  int;
  v_streak       int;
  v_active       boolean;
  v_mastered_at  timestamptz;
begin
  -- Lock the word row for the duration of the transaction
  select * into v_word from words where id = p_word_id for update;
  if not found then
    raise exception 'word not found: %', p_word_id;
  end if;

  v_stage_before := v_word.stage;
  v_streak       := v_word.stage6_streak;
  v_active       := v_word.active;
  v_mastered_at  := v_word.mastered_at;

  -- OnAnswer state machine (spec verbatim)
  if v_word.stage = 1 then
    v_stage_after := case when p_is_correct then 2 else 1 end;
  elsif v_word.stage = 2 then
    v_stage_after := case when p_is_correct then 3 else 2 end;
  elsif v_word.stage = 3 then
    v_stage_after := case when p_is_correct then 4 else 2 end;
  elsif v_word.stage = 4 then
    v_stage_after := case when p_is_correct then 5 else 2 end;
  elsif v_word.stage = 5 then
    v_stage_after := case when p_is_correct then 6 else 2 end;
  elsif v_word.stage = 6 then
    if p_is_correct then
      v_streak := v_streak + 1;
      if v_streak >= 3 then
        -- Word mastered — exits queue
        v_active      := false;
        v_mastered_at := now();
      end if;
      v_stage_after := 6;
    else
      v_stage_after := 2;
      v_streak      := 0;
    end if;
  else
    v_stage_after := v_word.stage;
  end if;

  -- Persist stage changes
  update words set
    stage         = v_stage_after,
    stage6_streak = v_streak,
    active        = v_active,
    mastered_at   = v_mastered_at
  where id = p_word_id;

  -- Mark queue item done
  update review_queue set status = 'completed' where id = p_review_id;

  -- Audit log
  insert into review_history (user_id, word_id, review_id, is_correct, stage_before, stage_after)
  values (v_word.user_id, p_word_id, p_review_id, p_is_correct, v_stage_before, v_stage_after);

  -- Schedule next review only if word is still active
  if v_active then
    -- Update the word row with final stage before scheduling so schedule_review reads it
    perform schedule_review(p_word_id);
  end if;

  return query select p_is_correct, v_stage_after;
end;
$$;
