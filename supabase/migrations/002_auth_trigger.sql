-- ============================================================
-- Auth trigger: auto-create org + member on email sign-up
-- ============================================================
-- Fires after a new user is confirmed in auth.users.
-- Reads metadata set during signUp() to create the org + member.
-- OAuth users land on /auth/onboarding instead (no metadata).
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id      uuid;
  v_company     text;
  v_slug        text;
  v_full_name   text;
  v_role        text;
begin
  -- Only proceed if the user has company metadata (email sign-up path)
  v_company   := new.raw_user_meta_data->>'company_name';
  v_full_name := new.raw_user_meta_data->>'full_name';
  v_role      := coalesce(new.raw_user_meta_data->>'role', 'admin');

  if v_company is null or v_company = '' then
    -- OAuth user — no metadata, onboarding page handles org creation
    return new;
  end if;

  -- Build a unique slug: slugified-company-name + 4 random chars
  v_slug := lower(regexp_replace(v_company, '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substr(md5(random()::text), 1, 4);

  -- Create organization
  insert into public.organizations (name, slug, plan)
  values (v_company, v_slug, 'team')
  returning id into v_org_id;

  -- Create member (admin by default for sign-up flow)
  insert into public.members (org_id, user_id, role, full_name, email, avatar_color)
  values (
    v_org_id,
    new.id,
    v_role,
    coalesce(v_full_name, split_part(new.email, '@', 1)),
    new.email,
    '#FF8A4C'
  );

  return new;
end;
$$;

-- Trigger fires after INSERT on auth.users (i.e. after email confirmation)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
