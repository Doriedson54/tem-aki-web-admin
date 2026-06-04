-- Tem Aki no Bairro - Schema base (Supabase/Postgres)
-- Execute este script no SQL Editor do Supabase.

create extension if not exists "pgcrypto";

-- Trigger util para updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (category_id, name)
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  main_product text,
  description text not null default '',
  address text not null default '',
  neighborhood text,
  city text,
  state text,
  zip_code text,
  phone text not null default '',
  whatsapp text,
  email text not null default '',
  website text,
  instagram text,
  facebook text,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid,
  status text not null default 'pending' check (status in ('pending', 'active', 'inactive')),
  delivery boolean not null default false,
  image_url text,
  logo_url text,
  latitude double precision,
  longitude double precision,
  opening_hours jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.businesses
  add column if not exists main_product text;

alter table public.businesses
  add column if not exists delivery boolean;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_businesses_updated_at'
  ) then
    create trigger trg_businesses_updated_at
    before update on public.businesses
    for each row execute function public.set_updated_at();
  end if;
end $$;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null,
  search_term text,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, business_id)
);

create index if not exists businesses_category_id_idx on public.businesses(category_id);
create index if not exists businesses_subcategory_id_idx on public.businesses(subcategory_id);
create index if not exists businesses_status_idx on public.businesses(status);
create index if not exists businesses_name_idx on public.businesses(name);
create index if not exists favorites_user_id_idx on public.favorites(user_id);
create index if not exists favorites_business_id_idx on public.favorites(business_id);
create index if not exists subcategories_category_id_idx on public.subcategories(category_id);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.businesses enable row level security;
alter table public.leads enable row level security;
alter table public.favorites enable row level security;

-- Policies básicas (leitura pública para catálogo; escrita autenticada)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='categories' and policyname='Public read categories'
  ) then
    create policy "Public read categories" on public.categories
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='subcategories' and policyname='Public read subcategories'
  ) then
    create policy "Public read subcategories" on public.subcategories
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='businesses' and policyname='Public read businesses'
  ) then
    create policy "Public read businesses" on public.businesses
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='favorites' and policyname='Users manage own favorites'
  ) then
    create policy "Users manage own favorites" on public.favorites
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users read own profile'
  ) then
    create policy "Users read own profile" on public.profiles
      for select using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users update own profile'
  ) then
    create policy "Users update own profile" on public.profiles
      for update using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end $$;

do $$
begin
  update public.businesses b
  set subcategory_id = null
  where subcategory_id is not null
    and not exists (select 1 from public.subcategories s where s.id = b.subcategory_id);

  begin
    alter table public.businesses
      add constraint businesses_subcategory_id_fkey
      foreign key (subcategory_id) references public.subcategories(id) on delete set null;
  exception when duplicate_object then
    null;
  end;
end $$;

do $$
begin
  insert into public.categories (name, icon)
  values
    ('Comércio', '🛍️'),
    ('Serviços', '🛠️'),
    ('Escolar', '🎓'),
    ('Instituições Públicas', '🏛️'),
    ('Instituições Comunitárias', '🤝'),
    ('Instituições Religiosas', '⛪')
  on conflict (name) do update set icon = excluded.icon;

  with cat as (select id from public.categories where name = 'Comércio')
  insert into public.subcategories (category_id, name)
  select cat.id, v.name
  from cat
  cross join (values
    ('Alimentação e Bebidas'),
    ('Vestuário e Acessórios'),
    ('Eletroeletrônicos'),
    ('Móveis e Decoração'),
    ('Higiene e Limpeza'),
    ('Saúde e Farmacêuticos'),
    ('Automotivos'),
    ('Motos e Bicicletas'),
    ('Brinquedos e Lazer'),
    ('Petshop'),
    ('Materiais de Construção'),
    ('Papelaria e Escritório'),
    ('Jóias e Relógios')
  ) as v(name)
  on conflict do nothing;

  with cat as (select id from public.categories where name = 'Serviços')
  insert into public.subcategories (category_id, name)
  select cat.id, v.name
  from cat
  cross join (values
    ('Domésticos e de Manutenção'),
    ('Comerciais'),
    ('Saúde e Bem-Estar'),
    ('Educacionais e Culturais'),
    ('Transportes'),
    ('Digitais e de Comunicação'),
    ('Financeiros e Administrativos')
  ) as v(name)
  on conflict do nothing;

  with cat as (select id from public.categories where name = 'Escolar')
  insert into public.subcategories (category_id, name)
  select cat.id, v.name
  from cat
  cross join (values
    ('Públicas'),
    ('Privadas')
  ) as v(name)
  on conflict do nothing;
end $$;
