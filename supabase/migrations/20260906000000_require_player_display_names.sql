-- Require every new account to claim a genuine, unique public display name.
-- Existing guest profiles remain valid until their next display-name update.

create or replace function public.validate_display_name_availability()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  normalized_name text := lower(trim(new.display_name));
begin
  if char_length(trim(new.display_name)) not between 2 and 24 then
    raise exception using
      errcode = '23514',
      message = 'Display name must be between 2 and 24 characters.';
  end if;

  if normalized_name in ('café guest', 'cafe guest', 'melburb player') then
    raise exception using
      errcode = '23514',
      message = 'Please choose your own display name.';
  end if;

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
  before insert or update of display_name on public.profiles
  for each row
  execute function public.validate_display_name_availability();

comment on column public.profiles.display_name is
  'Required player-selected public name, 2-24 characters, unique case-insensitively after trimming; guest defaults are reserved.';
