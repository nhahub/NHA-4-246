-- Add helper RPC needed by assessPronunciation
create or replace function increment_phoneme_attempts(
  p_user_id uuid,
  p_lang     text,
  p_phoneme  text
)
returns void
language plpgsql
security definer
as $$
begin
  update phoneme_assessments
  set attempts = attempts + 1
  where user_id = p_user_id
    and target_language = p_lang
    and phoneme = p_phoneme;
end;
$$;
