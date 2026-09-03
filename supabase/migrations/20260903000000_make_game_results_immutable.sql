drop policy if exists "Players can update their own results"
  on public.game_results;

comment on table public.game_results is
  'Completed game results are immutable. The unique user_id and game_key constraint enforces one result per player per daily challenge.';
