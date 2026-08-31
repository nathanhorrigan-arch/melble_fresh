-- Lock display_name once set - prevent updates after initial creation

create or replace function public.validate_display_name_lock()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  -- Allow insert if display_name is NULL
  -- Allow update only if display_name is currently NULL (first time setting)
  if new.display_name is not null and old.display_name is not null then
    raise exception 'Display name cannot be changed once set.';
  end if;
  return new;
end;
$$;

-- Drop existing trigger if present and recreate
drop trigger if exists validate_display_name_lock_trigger on public.profiles;

create trigger validate_display_name_lock_trigger
  before update of display_name on public.profiles
  for each row
  execute function public.validate_display_name_lock();
