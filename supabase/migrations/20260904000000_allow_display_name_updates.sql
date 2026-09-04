-- Players may update their own display name. Existing profanity validation,
-- length checks and row-level ownership policy continue to apply.

drop trigger if exists validate_display_name_lock_trigger on public.profiles;
drop function if exists public.validate_display_name_lock();

create or replace function public.validate_display_name_availability()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  normalized_name text := lower(trim(new.display_name));
begin
  -- Serialise attempts to claim the same normalized name so that two players
  -- cannot pass the availability check at the same moment.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(normalized_name, 0)
  );

  if exists (
    select 1
    from public.profiles
    where id <> new.id
      and lower(trim(display_name)) = normalized_name
  ) then
    raise exception using
      errcode = '23505',
      message = 'Display name is already in use.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_display_name_availability_trigger
  on public.profiles;

create trigger validate_display_name_availability_trigger
  before update of display_name on public.profiles
  for each row
  when (old.display_name is distinct from new.display_name)
  execute function public.validate_display_name_availability();

comment on column public.profiles.display_name is
  'Player-selected public name. Owners may update it; names must be unique when compared case-insensitively after trimming.';
