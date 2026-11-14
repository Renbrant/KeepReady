-- KeepReady: casa, membros e sincronização (MVP).
-- Já aplicada no projeto Supabase "KeepReady" como migração 20261113171845 (keepready_sync).
-- Para um projeto novo: SQL Editor > New query > cole tudo > Run (ou `supabase db push`).
-- É seguro rodar de novo: usa "if not exists", "or replace" e "drop ... if exists".
-- Depois, em Authentication > Providers > Email, desligue "Confirm email" se quiser
-- que a família entre sem precisar confirmar o e-mail (bom para o teste).

create extension if not exists pgcrypto;

-- Casa: um grupo familiar com código de convite.
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  invite_code text not null unique default upper(encode(gen_random_bytes(5), 'hex')),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

-- Quem pertence a cada casa.
create table if not exists public.household_users (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  display_name text,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- Dados do app: um registro por balde, item de compra, pessoa etc.
-- O servidor carimba updated_at; o app busca o que mudou desde a última vez.
create table if not exists public.records (
  household_id uuid not null references public.households (id) on delete cascade,
  id text not null,
  kind text not null check (kind in ('settings', 'member', 'bucket', 'pantry', 'shop', 'supply', 'gear', 'water')),
  data jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (household_id, id)
);

create index if not exists records_household_updated_idx on public.records (household_id, updated_at);
create index if not exists household_users_user_idx on public.household_users (user_id);

create or replace function public.touch_record()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := clock_timestamp();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists records_touch on public.records;
create trigger records_touch
  before insert or update on public.records
  for each row execute function public.touch_record();

-- Pertence à casa? (security definer evita recursão nas políticas)
create or replace function public.is_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_users hu
    where hu.household_id = hid and hu.user_id = auth.uid()
  );
$$;

alter table public.households enable row level security;
alter table public.household_users enable row level security;
alter table public.records enable row level security;

drop policy if exists households_select on public.households;
create policy households_select on public.households
  for select to authenticated using (public.is_member(id));

drop policy if exists household_users_select on public.household_users;
create policy household_users_select on public.household_users
  for select to authenticated using (public.is_member(household_id));

drop policy if exists records_all on public.records;
create policy records_all on public.records
  for all to authenticated
  using (public.is_member(household_id))
  with check (public.is_member(household_id));

-- Criar casa e entrar com código só passam por estas funções (não há política de escrita nas tabelas de casa).
create or replace function public.create_household(p_name text, p_display text default null)
returns table (id uuid, name text, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  h public.households;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  insert into public.households (name) values (left(trim(p_name), 80)) returning * into h;
  insert into public.household_users (household_id, user_id, role, display_name)
  values (h.id, auth.uid(), 'owner', nullif(trim(p_display), ''));
  return query select h.id, h.name, h.invite_code;
end;
$$;

create or replace function public.join_household(p_code text, p_display text default null)
returns table (id uuid, name text, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  h public.households;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  select * into h from public.households x where x.invite_code = upper(trim(p_code));
  if h.id is null then
    raise exception 'invalid_code';
  end if;
  insert into public.household_users (household_id, user_id, role, display_name)
  values (h.id, auth.uid(), 'member', nullif(trim(p_display), ''))
  on conflict (household_id, user_id) do nothing;
  return query select h.id, h.name, h.invite_code;
end;
$$;

create or replace function public.my_household()
returns table (id uuid, name text, invite_code text)
language sql
stable
security definer
set search_path = public
as $$
  select h.id, h.name, h.invite_code
  from public.households h
  join public.household_users hu on hu.household_id = h.id
  where hu.user_id = auth.uid()
  order by hu.joined_at
  limit 1;
$$;

revoke all on function public.is_member(uuid) from public, anon;
grant execute on function public.is_member(uuid) to authenticated;
revoke all on function public.create_household(text, text) from public, anon;
revoke all on function public.join_household(text, text) from public, anon;
revoke all on function public.my_household() from public, anon;
grant execute on function public.create_household(text, text) to authenticated;
grant execute on function public.join_household(text, text) to authenticated;
grant execute on function public.my_household() to authenticated;
