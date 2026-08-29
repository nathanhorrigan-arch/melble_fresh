alter table public.game_results
  drop constraint game_results_mode_check;

alter table public.game_results
  add constraint game_results_mode_check
  check (mode in ('daily', 'practice', 'challenge'));
