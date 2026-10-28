-- EntryFlow hosted data model foundation (Supabase/Postgres).
-- Run only in a new Supabase project after reviewing the project-specific setup.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  venue text not null,
  address text not null default '',
  map_url text not null default '',
  event_date date not null,
  start_time time,
  end_time time,
  description text not null default '',
  invitation_message text not null default '',
  status text not null default 'Draft' check (status in ('Draft','Ready','Live','Closed','Archived')),
  archived_at timestamptz,
  deleted_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null default '',
  role text not null check (role in ('Global Admin','Superhost','Host','Supervisor','Gate Scanner')),
  event_id uuid references public.events(id) on delete restrict,
  active boolean not null default true,
  device_label text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint global_admin_without_event check ((role = 'Global Admin' and event_id is null) or (role <> 'Global Admin' and event_id is not null))
);

create table if not exists public.host_allocations (
  user_id uuid primary key references public.profiles(user_id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  quota integer not null check (quota >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.guest_passes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  host_id uuid not null references public.host_allocations(user_id) on delete restrict,
  public_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  primary_guest_name text not null,
  total_count integer not null check (total_count > 0),
  entered_count integer not null default 0 check (entered_count >= 0),
  inside_count integer not null default 0 check (inside_count >= 0),
  locked_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  check (entered_count <= total_count),
  check (inside_count <= entered_count)
);

create table if not exists public.gate_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  pass_id uuid references public.guest_passes(id) on delete restrict,
  source_entry_id uuid references public.gate_entries(id) on delete restrict,
  actor_id uuid not null references public.profiles(user_id) on delete restrict,
  action text not null check (action in ('check-in','manual-check-in','check-out')),
  count integer not null check (count > 0),
  gate_name text not null,
  optional_guest_name text,
  scanned_at timestamptz not null default now(),
  reversed_at timestamptz,
  reversed_by uuid references public.profiles(user_id),
  reversal_reason text not null default ''
);

create table if not exists public.account_invites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  role text not null check (role in ('Superhost','Host','Supervisor','Gate Scanner')),
  token_hash text not null unique,
  host_quota integer check (host_quota is null or host_quota >= 0),
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  claimed_by uuid references public.profiles(user_id),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  event_id uuid references public.events(id) on delete restrict,
  actor_id uuid references public.profiles(user_id) on delete set null,
  actor_role text not null,
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists guest_passes_event_host_idx on public.guest_passes(event_id, host_id) where deleted_at is null;
create index if not exists gate_entries_event_time_idx on public.gate_entries(event_id, scanned_at desc);
create index if not exists audit_logs_event_time_idx on public.audit_logs(event_id, created_at desc);
create index if not exists account_invites_event_idx on public.account_invites(event_id, created_at desc);

create or replace function public.current_role()
returns text language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.user_id = (select auth.uid()) and p.active
$$;

create or replace function public.current_event_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select p.event_id from public.profiles p where p.user_id = (select auth.uid()) and p.active
$$;

create or replace function public.can_access_event(target_event uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.active and (p.role = 'Global Admin' or p.event_id = target_event))
$$;

create or replace function public.can_manage_event(target_event uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.active and (p.role = 'Global Admin' or (p.role = 'Superhost' and p.event_id = target_event)))
$$;

alter table public.events enable row level security;
alter table public.profiles enable row level security;
alter table public.host_allocations enable row level security;
alter table public.guest_passes enable row level security;
alter table public.gate_entries enable row level security;
alter table public.account_invites enable row level security;
alter table public.audit_logs enable row level security;

create policy events_read_assigned on public.events for select to authenticated using (public.can_access_event(id));
create policy events_insert_admin on public.events for insert to authenticated with check (public.current_role() = 'Global Admin');
create policy events_update_managers on public.events for update to authenticated using (public.can_manage_event(id)) with check (public.can_manage_event(id));
create policy profiles_read_scope on public.profiles for select to authenticated using (user_id = (select auth.uid()) or public.can_access_event(event_id));
create policy profiles_update_managers on public.profiles for update to authenticated using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id));
create policy allocations_read_scope on public.host_allocations for select to authenticated using (public.can_access_event(event_id));
create policy allocations_manage on public.host_allocations for all to authenticated using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id));
create policy passes_read_event on public.guest_passes for select to authenticated using (public.can_access_event(event_id));
create policy passes_create_scope on public.guest_passes for insert to authenticated with check (
  public.can_manage_event(event_id) or (host_id = (select auth.uid()) and public.current_role() = 'Host' and event_id = public.current_event_id())
);
create policy passes_update_scope on public.guest_passes for update to authenticated using (
  public.can_manage_event(event_id) or (host_id = (select auth.uid()) and public.current_role() = 'Host' and entered_count = 0 and event_id = public.current_event_id())
) with check (public.can_access_event(event_id));
create policy entries_read_event on public.gate_entries for select to authenticated using (public.can_access_event(event_id));
create policy entries_create_gate on public.gate_entries for insert to authenticated with check (
  public.can_access_event(event_id) and public.current_role() in ('Global Admin','Superhost','Supervisor','Gate Scanner')
);
create policy entries_reverse_managers on public.gate_entries for update to authenticated using (
  public.can_manage_event(event_id) or (public.current_role() = 'Supervisor' and event_id = public.current_event_id()) or (actor_id = (select auth.uid()) and public.current_role() = 'Gate Scanner' and event_id = public.current_event_id())
) with check (public.can_access_event(event_id));
create policy invites_read_managers on public.account_invites for select to authenticated using (
  public.can_manage_event(event_id) or (public.current_role() = 'Host' and event_id = public.current_event_id() and role = 'Gate Scanner')
);
create policy invites_create_managers on public.account_invites for insert to authenticated with check (
  public.can_manage_event(event_id) and ((public.current_role() = 'Global Admin') or role <> 'Superhost')
  or (public.current_role() = 'Host' and event_id = public.current_event_id() and role = 'Gate Scanner')
);
create policy invites_revoke_managers on public.account_invites for update to authenticated using (
  public.can_manage_event(event_id) or (public.current_role() = 'Host' and event_id = public.current_event_id() and role = 'Gate Scanner')
) with check (public.can_access_event(event_id));
create policy audit_read_scope on public.audit_logs for select to authenticated using (event_id is null and public.current_role() = 'Global Admin' or public.can_access_event(event_id));

-- An invite is a bearer secret. Only its SHA-256 digest is stored. The caller must
-- first obtain a Supabase anonymous session; this RPC binds the claimed role and
-- event to that authenticated user and atomically consumes the link.
create or replace function public.claim_account_invite(invite_token text, requested_device_label text default '')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  found_invite public.account_invites%rowtype;
  new_name text;
begin
  if auth.uid() is null then raise exception 'A signed-in device session is required'; end if;
  select * into found_invite from public.account_invites
    where token_hash = encode(extensions.digest(invite_token, 'sha256'), 'hex')
      and claimed_at is null and revoked_at is null and expires_at > now()
    for update;
  if not found then raise exception 'Invite is invalid, expired, revoked, or already used'; end if;
  if exists (select 1 from public.profiles where user_id = auth.uid()) then raise exception 'This device account already claimed an invite'; end if;
  new_name := found_invite.role || ' · ' || coalesce(nullif(left(requested_device_label, 80), ''), 'Device');
  insert into public.profiles(user_id, display_name, role, event_id, device_label, created_by)
    values (auth.uid(), new_name, found_invite.role, found_invite.event_id, coalesce(left(requested_device_label, 80), ''), found_invite.created_by);
  if found_invite.role = 'Host' then
    insert into public.host_allocations(user_id, event_id, quota)
      values (auth.uid(), found_invite.event_id, coalesce(found_invite.host_quota, 10));
  end if;
  update public.account_invites set claimed_at = now(), claimed_by = auth.uid() where id = found_invite.id;
  insert into public.audit_logs(event_id, actor_id, actor_role, action, target_type, target_id, details)
    values (found_invite.event_id, auth.uid(), found_invite.role, 'account-invite-claimed', 'profile', auth.uid()::text, jsonb_build_object('device_label', requested_device_label));
  return jsonb_build_object('role', found_invite.role, 'event_id', found_invite.event_id, 'display_name', new_name);
end;
$$;

revoke all on function public.claim_account_invite(text, text) from public;
grant execute on function public.claim_account_invite(text, text) to authenticated;

-- Guest-facing reads are deliberately projection-only so public invite pages do
-- not expose team accounts, audit records, or gate activity.
create or replace function public.public_guest_pass(pass_token text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'pass', jsonb_build_object('primary_guest_name', p.primary_guest_name, 'total_count', p.total_count, 'entered_count', p.entered_count, 'inside_count', p.inside_count, 'public_token', p.public_token),
    'event', jsonb_build_object('name', e.name, 'venue', e.venue, 'address', e.address, 'map_url', e.map_url, 'event_date', e.event_date, 'start_time', e.start_time, 'end_time', e.end_time, 'description', e.description, 'invitation_message', e.invitation_message)
  ) from public.guest_passes p join public.events e on e.id = p.event_id
  where p.public_token = pass_token and p.deleted_at is null and e.deleted_at is null
$$;
revoke all on function public.public_guest_pass(text) from public;
grant execute on function public.public_guest_pass(text) to anon, authenticated;
