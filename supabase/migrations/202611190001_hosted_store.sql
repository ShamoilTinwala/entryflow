-- Authoritative store for the Vercel API. Rows are inaccessible to browser keys.
create table if not exists public.entryflow_store (
  id integer primary key check (id = 1),
  revision bigint not null default 0,
  data jsonb not null
);
alter table public.entryflow_store enable row level security;
revoke all on public.entryflow_store from public, anon, authenticated;
grant select, update on public.entryflow_store to service_role;
insert into public.entryflow_store(id,data) values (1,
  '{"events":[],"members":[],"hosts":[],"guests":[],"entries":[],"audit":[],"invites":[],"sessions":[],"receipts":[]}')
on conflict(id) do nothing;
