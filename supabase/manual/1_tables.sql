-- =====================================================================
-- STEP 1 of 3 — Tables, indexes, triggers and row-level security
-- Supabase → SQL Editor → New query → paste this whole file → Run.
-- Safe to run more than once.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('customer', 'admin');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.order_status as enum ('pending', 'slip_uploaded', 'approved', 'delivered', 'rejected');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 120),
  phone       text check (char_length(phone) <= 30),
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    left(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 120),
    left(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), 30)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role check used by RLS policies. SECURITY DEFINER avoids recursive RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 80),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description  text check (char_length(description) <= 500),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 160),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description  text not null default '' check (char_length(description) <= 5000),
  category_id  uuid references public.categories (id) on delete set null,
  is_active    boolean not null default true,
  is_featured  boolean not null default false,
  -- Denormalised from variants (kept in sync by trigger) for fast filtering/sorting
  min_price    integer,
  total_stock  integer not null default 0,
  search       tsvector generated always as (
                 setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
                 setweight(to_tsvector('simple', coalesce(description, '')), 'B')
               ) stored,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_created_idx on public.products (is_active, created_at desc);
create index if not exists products_min_price_idx on public.products (min_price);
create index if not exists products_search_idx on public.products using gin (search);
-- Optional fuzzy-search index: skipped (with a notice) if the pg_trgm extension isn't available.
do $$
begin
  create extension if not exists pg_trgm with schema extensions;
  execute 'create index if not exists products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops)';
exception when others then
  raise notice 'Skipped optional trigram index: %', sqlerrm;
end $$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create table if not exists public.product_variants (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products (id) on delete cascade,
  name              text not null default 'Default' check (char_length(name) between 1 and 80),
  sku               text unique check (char_length(sku) <= 64),
  price             integer not null check (price >= 0),
  compare_at_price  integer check (compare_at_price is null or compare_at_price >= 0),
  stock             integer not null default 0 check (stock >= 0),
  position          integer not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists product_variants_product_idx on public.product_variants (product_id, position);

create table if not exists public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  storage_path  text not null,
  alt           text check (char_length(alt) <= 200),
  width         integer,
  height        integer,
  position      integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists product_images_product_idx on public.product_images (product_id, position);

-- Keep products.min_price / total_stock in sync with variants
create or replace function public.refresh_product_aggregates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pid uuid;
begin
  if tg_op = 'DELETE' then
    v_pid := old.product_id;
  else
    v_pid := new.product_id;
  end if;

  update public.products p
     set min_price   = (select min(v.price) from public.product_variants v where v.product_id = v_pid),
         total_stock = (select coalesce(sum(v.stock), 0) from public.product_variants v where v.product_id = v_pid)
   where p.id = v_pid;

  return null;
end;
$$;

drop trigger if exists product_variants_aggregates on public.product_variants;
create trigger product_variants_aggregates
  after insert or update or delete on public.product_variants
  for each row execute function public.refresh_product_aggregates();

-- ---------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       bigint generated always as identity (start with 1001) unique,
  user_id            uuid not null references auth.users (id) on delete restrict,
  status             public.order_status not null default 'pending',
  subtotal           integer not null default 0 check (subtotal >= 0),
  shipping_fee       integer not null default 0 check (shipping_fee >= 0),
  total              integer not null default 0 check (total >= 0),
  customer_name      text not null check (char_length(customer_name) between 1 and 120),
  phone              text not null check (char_length(phone) between 3 and 30),
  address            text not null check (char_length(address) between 3 and 500),
  notes              text check (char_length(notes) <= 1000),
  payment_slip_path  text,
  slip_uploaded_at   timestamptz,
  admin_note         text check (char_length(admin_note) <= 1000),
  approved_at        timestamptz,
  delivered_at       timestamptz,
  rejected_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_id    uuid references public.products (id) on delete set null,
  variant_id    uuid references public.product_variants (id) on delete set null,
  -- Snapshots so history stays correct if the catalog changes
  product_name  text not null,
  variant_name  text not null,
  image_path    text,
  unit_price    integer not null check (unit_price >= 0),
  quantity      integer not null check (quantity between 1 and 100),
  line_total    integer not null check (line_total >= 0)
);

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_variant_idx on public.order_items (variant_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

create table if not exists public.order_status_history (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  status      public.order_status not null,
  note        text,
  changed_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists order_status_history_order_idx on public.order_status_history (order_id, created_at);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.product_variants     enable row level security;
alter table public.product_images       enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;

-- Profiles: users read/update their own; admins read all.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Users may only change their name/phone — never their role.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone) on public.profiles to authenticated;

-- Catalog: public read (active only), admin write.
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select to anon, authenticated using (true);
drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "variants_public_read" on public.product_variants;
create policy "variants_public_read" on public.product_variants
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.is_active or (select public.is_admin()))));
drop policy if exists "variants_admin_write" on public.product_variants;
create policy "variants_admin_write" on public.product_variants
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "images_public_read" on public.product_images;
create policy "images_public_read" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.is_active or (select public.is_admin()))));
drop policy if exists "images_admin_write" on public.product_images;
create policy "images_admin_write" on public.product_images
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Orders: read own or admin. ALL writes go through SECURITY DEFINER RPCs below,
-- so there are deliberately no insert/update/delete policies.
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.user_id = (select auth.uid()) or (select public.is_admin()))));

drop policy if exists "order_history_select_own_or_admin" on public.order_status_history;
create policy "order_history_select_own_or_admin" on public.order_status_history
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.user_id = (select auth.uid()) or (select public.is_admin()))));

-- ---------------------------------------------------------------------
-- Profiles for users that were created before this script ran
-- ---------------------------------------------------------------------
insert into public.profiles (id, full_name, phone)
select id,
       left(nullif(trim(raw_user_meta_data ->> 'full_name'), ''), 120),
       left(nullif(trim(raw_user_meta_data ->> 'phone'), ''), 30)
from auth.users
on conflict (id) do nothing;
