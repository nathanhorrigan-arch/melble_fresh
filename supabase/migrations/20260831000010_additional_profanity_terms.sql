-- Additional profanity filter terms

create or replace function public.validate_display_name()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  blocked_terms text[] := array[
    'fuck', 'shit', 'bitch', 'cunt', 'nigger', 'faggot', 'retard', 
    'whore', 'slut', 'pussy', 'dick', 'cock', 'asshole', 'bastard', 
    'damn', 'hell', 'piss', 'cum', 'jizz', 'twat', 'crap', 'wank',
    'fag', 'dyke', 'tranny', 'shemale', 'kike', 'spic', 'chink', 
    'gook', 'wetback', 'raghead', 'sandnigger', 'porchmonkey',
    'coon', 'nigga', 'niggah', 'nigguh', 'niglet', 'coonass',
    'honky', 'cracker', 'whitey', 'redneck', 'hillbilly', 'trailertrash',
    'nazi', 'jew', 'motherfucker', 'fucker', 'fucked', 'fuck_me', 'fuck me', 'fuck it'
  ];
  clean_name text := lower(new.display_name);
  term text;
begin
  foreach term in array blocked_terms
  loop
    if clean_name like '%' || term || '%' then
      raise exception 'Display name contains inappropriate content';
    end if;
  end loop;
  return new;
end;
$$;