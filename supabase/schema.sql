-- =====================================================================
-- schema.sql — complete database schema for the online store.
-- Paste the whole file into Supabase → SQL Editor → New query → Run.
-- Run once on a fresh project. (Sample products are in seed.sql.)
--
-- Contents:
--   1. Tables, RLS security, functions and storage buckets
--   2. Storefront update (deals filter + one-click add to cart)
--   3. Profiles for any users created before this script ran
-- =====================================================================

-- ===================== 1. Core schema =====================
-- =====================================================================
-- Online Store — initial schema
-- Run in Supabase SQL Editor (or `supabase db push`).
-- All money values are stored as INTEGER minor units (e.g. laari/cents)
-- to avoid floating point rounding errors.
-- =====================================================================

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type public.user_role as enum ('customer', 'admin');
create type public.order_status as enum ('pending', 'slip_uploaded', 'approved', 'delivered', 'rejected');

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
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 120),
  phone       text check (char_length(phone) <= 30),
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
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
create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 80),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description  text check (char_length(description) <= 500),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create table public.products (
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

create index products_category_idx on public.products (category_id);
create index products_active_created_idx on public.products (is_active, created_at desc);
create index products_min_price_idx on public.products (min_price);
create index products_search_idx on public.products using gin (search);
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);

create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_variants (
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

create index product_variants_product_idx on public.product_variants (product_id, position);

create table public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  storage_path  text not null,
  alt           text check (char_length(alt) <= 200),
  width         integer,
  height        integer,
  position      integer not null default 0,
  created_at    timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, position);

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

create trigger product_variants_aggregates
  after insert or update or delete on public.product_variants
  for each row execute function public.refresh_product_aggregates();

-- ---------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------
create table public.orders (
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

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);

create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
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

create index order_items_order_idx on public.order_items (order_id);
create index order_items_variant_idx on public.order_items (variant_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.order_status_history (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  status      public.order_status not null,
  note        text,
  changed_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

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
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Users may only change their name/phone — never their role.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone) on public.profiles to authenticated;

-- Catalog: public read (active only), admin write.
create policy "categories_public_read" on public.categories
  for select to anon, authenticated using (true);
create policy "categories_admin_write" on public.categories
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "products_public_read" on public.products
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "products_admin_write" on public.products
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "variants_public_read" on public.product_variants
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.is_active or (select public.is_admin()))));
create policy "variants_admin_write" on public.product_variants
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "images_public_read" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.is_active or (select public.is_admin()))));
create policy "images_admin_write" on public.product_images
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Orders: read own or admin. ALL writes go through SECURITY DEFINER RPCs below,
-- so there are deliberately no insert/update/delete policies.
create policy "orders_select_own_or_admin" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "order_items_select_own_or_admin" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.user_id = (select auth.uid()) or (select public.is_admin()))));

create policy "order_history_select_own_or_admin" on public.order_status_history
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.user_id = (select auth.uid()) or (select public.is_admin()))));

-- ---------------------------------------------------------------------
-- RPC: search products (respects RLS — SECURITY INVOKER)
-- ---------------------------------------------------------------------
create or replace function public.search_products(
  p_query      text    default null,
  p_category   text    default null,
  p_min_price  integer default null,
  p_max_price  integer default null,
  p_in_stock   boolean default false,
  p_sort       text    default 'newest',
  p_limit      integer default 24,
  p_offset     integer default 0,
  p_featured   boolean default false
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_q      text := nullif(trim(left(p_query, 100)), '');
  v_like   text;
  v_tsq    tsquery;
  v_limit  integer := least(greatest(coalesce(p_limit, 24), 1), 60);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_result jsonb;
begin
  if v_q is not null then
    v_tsq  := websearch_to_tsquery('simple', v_q);
    v_like := '%' || replace(replace(replace(v_q, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;

  with filtered as (
    select p.id, p.name, p.slug, p.min_price, p.total_stock, p.created_at, p.is_featured,
           c.name as category_name, c.slug as category_slug,
           case when v_tsq is not null then ts_rank(p.search, v_tsq) else 0 end as rank
      from public.products p
      left join public.categories c on c.id = p.category_id
     where p.is_active
       and (v_q is null or p.search @@ v_tsq or p.name ilike v_like)
       and (p_category is null or c.slug = p_category)
       and (p_min_price is null or p.min_price >= p_min_price)
       and (p_max_price is null or p.min_price <= p_max_price)
       and (not coalesce(p_in_stock, false) or p.total_stock > 0)
       and (not coalesce(p_featured, false) or p.is_featured)
  ),
  page as (
    select f.*,
           (select i.storage_path from public.product_images i
             where i.product_id = f.id order by i.position, i.created_at limit 1) as image_path,
           (select max(v.compare_at_price) from public.product_variants v
             where v.product_id = f.id) as compare_at_price
      from filtered f
     order by
       case when p_sort = 'price_asc'  then f.min_price end asc nulls last,
       case when p_sort = 'price_desc' then f.min_price end desc nulls last,
       case when p_sort = 'name'       then f.name end asc,
       case when p_sort = 'relevance'  then f.rank end desc,
       f.created_at desc
     limit v_limit offset v_offset
  )
  select jsonb_build_object(
           'total', (select count(*) from filtered),
           'items', coalesce((select jsonb_agg(to_jsonb(pg) - 'rank') from page pg), '[]'::jsonb)
         )
    into v_result;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: place order (atomic stock reservation, server-side prices)
-- ---------------------------------------------------------------------
create or replace function public.place_order(
  p_items          jsonb,
  p_customer_name  text,
  p_phone          text,
  p_address        text,
  p_notes          text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := auth.uid();
  v_order_id  uuid;
  v_subtotal  integer := 0;
  v_open      integer;
  r           record;
  v_variant   record;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'INVALID_CART' using errcode = '22023';
  end if;

  -- Abuse guard: limit how much stock one account can hold in unpaid orders.
  select count(*) into v_open from public.orders
   where user_id = v_uid and status in ('pending', 'slip_uploaded');
  if v_open >= 5 then
    raise exception 'TOO_MANY_OPEN_ORDERS' using errcode = 'P0001';
  end if;

  insert into public.orders (user_id, customer_name, phone, address, notes)
  values (v_uid, trim(p_customer_name), trim(p_phone), trim(p_address), nullif(trim(p_notes), ''))
  returning id into v_order_id;

  -- Lock variants in a stable order to avoid deadlocks between concurrent checkouts.
  for r in
    select (e ->> 'variant_id')::uuid as variant_id, sum((e ->> 'quantity')::integer)::integer as qty
      from jsonb_array_elements(p_items) e
     group by 1
     order by 1
  loop
    if r.qty is null or r.qty < 1 or r.qty > 100 then
      raise exception 'INVALID_QUANTITY' using errcode = '22023';
    end if;

    select v.id, v.name, v.price, v.stock, v.product_id, p.name as product_name, p.is_active,
           (select i.storage_path from public.product_images i
             where i.product_id = p.id order by i.position, i.created_at limit 1) as image_path
      into v_variant
      from public.product_variants v
      join public.products p on p.id = v.product_id
     where v.id = r.variant_id
       for update of v;

    if not found or not v_variant.is_active then
      raise exception 'PRODUCT_UNAVAILABLE' using errcode = 'P0001';
    end if;

    if v_variant.stock < r.qty then
      raise exception 'OUT_OF_STOCK:%', v_variant.product_name || ' (' || v_variant.name || ')' using errcode = 'P0001';
    end if;

    update public.product_variants set stock = stock - r.qty where id = v_variant.id;

    insert into public.order_items (order_id, product_id, variant_id, product_name, variant_name,
                                    image_path, unit_price, quantity, line_total)
    values (v_order_id, v_variant.product_id, v_variant.id, v_variant.product_name, v_variant.name,
            v_variant.image_path, v_variant.price, r.qty, v_variant.price * r.qty);

    v_subtotal := v_subtotal + v_variant.price * r.qty;
  end loop;

  update public.orders set subtotal = v_subtotal, total = v_subtotal + shipping_fee where id = v_order_id;

  insert into public.order_status_history (order_id, status, changed_by)
  values (v_order_id, 'pending', v_uid);

  return v_order_id;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: customer attaches an uploaded payment slip
-- ---------------------------------------------------------------------
create or replace function public.attach_payment_slip(p_order_id uuid, p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_status public.order_status;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  if p_path is null or p_path not like (v_uid::text || '/' || p_order_id::text || '/%') then
    raise exception 'INVALID_PATH' using errcode = '22023';
  end if;

  select status into v_status from public.orders
   where id = p_order_id and user_id = v_uid
     for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_status not in ('pending', 'slip_uploaded') then
    raise exception 'INVALID_STATUS' using errcode = 'P0001';
  end if;

  update public.orders
     set status = 'slip_uploaded', payment_slip_path = p_path, slip_uploaded_at = now()
   where id = p_order_id;

  insert into public.order_status_history (order_id, status, changed_by, note)
  values (p_order_id, 'slip_uploaded', v_uid,
          case when v_status = 'slip_uploaded' then 'Slip re-uploaded' end);
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: admin changes order status (enforces allowed transitions)
-- ---------------------------------------------------------------------
create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_status   public.order_status,
  p_note     text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current public.order_status;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select status into v_current from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not (
       (v_current = 'slip_uploaded' and p_status in ('approved', 'rejected'))
    or (v_current = 'pending'       and p_status = 'rejected')
    or (v_current = 'approved'      and p_status = 'delivered')
  ) then
    raise exception 'INVALID_TRANSITION:% -> %', v_current, p_status using errcode = 'P0001';
  end if;

  -- Rejecting releases the reserved stock.
  if p_status = 'rejected' then
    update public.product_variants v
       set stock = v.stock + oi.quantity
      from public.order_items oi
     where oi.order_id = p_order_id and oi.variant_id = v.id;
  end if;

  update public.orders
     set status       = p_status,
         admin_note   = coalesce(nullif(trim(p_note), ''), admin_note),
         approved_at  = case when p_status = 'approved'  then now() else approved_at end,
         delivered_at = case when p_status = 'delivered' then now() else delivered_at end,
         rejected_at  = case when p_status = 'rejected'  then now() else rejected_at end
   where id = p_order_id;

  insert into public.order_status_history (order_id, status, note, changed_by)
  values (p_order_id, p_status, nullif(trim(p_note), ''), auth.uid());
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: admin create/update product with variants atomically
-- ---------------------------------------------------------------------
create or replace function public.admin_save_product(p jsonb)
returns uuid
language plpgsql
security invoker -- RLS admin policies apply as well
set search_path = ''
as $$
declare
  v_pid   uuid := nullif(p ->> 'id', '')::uuid;
  v_keep  uuid[] := '{}';
  v_vid   uuid;
  v       jsonb;
  v_pos   integer := 0;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if jsonb_typeof(p -> 'variants') <> 'array' or jsonb_array_length(p -> 'variants') = 0 then
    raise exception 'VARIANTS_REQUIRED' using errcode = '22023';
  end if;

  if v_pid is null then
    insert into public.products (name, slug, description, category_id, is_active, is_featured)
    values (p ->> 'name', p ->> 'slug', coalesce(p ->> 'description', ''),
            nullif(p ->> 'category_id', '')::uuid,
            coalesce((p ->> 'is_active')::boolean, true),
            coalesce((p ->> 'is_featured')::boolean, false))
    returning id into v_pid;
  else
    update public.products
       set name = p ->> 'name',
           slug = p ->> 'slug',
           description = coalesce(p ->> 'description', ''),
           category_id = nullif(p ->> 'category_id', '')::uuid,
           is_active = coalesce((p ->> 'is_active')::boolean, true),
           is_featured = coalesce((p ->> 'is_featured')::boolean, false)
     where id = v_pid;
    if not found then
      raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0002';
    end if;
  end if;

  for v in select * from jsonb_array_elements(p -> 'variants')
  loop
    v_vid := nullif(v ->> 'id', '')::uuid;

    if v_vid is not null then
      update public.product_variants
         set name = v ->> 'name',
             sku = nullif(v ->> 'sku', ''),
             price = (v ->> 'price')::integer,
             compare_at_price = nullif(v ->> 'compare_at_price', '')::integer,
             stock = (v ->> 'stock')::integer,
             position = v_pos
       where id = v_vid and product_id = v_pid;
      if not found then
        v_vid := null;
      end if;
    end if;

    if v_vid is null then
      insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
      values (v_pid, v ->> 'name', nullif(v ->> 'sku', ''), (v ->> 'price')::integer,
              nullif(v ->> 'compare_at_price', '')::integer, (v ->> 'stock')::integer, v_pos)
      returning id into v_vid;
    end if;

    v_keep := v_keep || v_vid;
    v_pos := v_pos + 1;
  end loop;

  delete from public.product_variants where product_id = v_pid and not (id = any (v_keep));

  return v_pid;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: admin dashboard statistics
-- ---------------------------------------------------------------------
create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'revenue',          (select coalesce(sum(total), 0) from public.orders where status in ('approved', 'delivered')),
    'revenue_30d',      (select coalesce(sum(total), 0) from public.orders
                          where status in ('approved', 'delivered') and created_at >= now() - interval '30 days'),
    'orders_total',     (select count(*) from public.orders),
    'orders_by_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
                           from (select status, count(*) n from public.orders group by status) s),
    'products_total',   (select count(*) from public.products),
    'products_active',  (select count(*) from public.products where is_active),
    'customers_total',  (select count(*) from public.profiles where role = 'customer'),
    'low_stock',        (select count(*) from public.product_variants where stock <= 5),
    'daily',            (select jsonb_agg(jsonb_build_object('day', d::date, 'orders', coalesce(x.n, 0), 'revenue', coalesce(x.rev, 0)) order by d)
                           from generate_series(current_date - 13, current_date, interval '1 day') d
                           left join (
                             select created_at::date as day, count(*) n,
                                    sum(total) filter (where status in ('approved', 'delivered')) rev
                               from public.orders
                              where created_at >= current_date - 13
                              group by 1
                           ) x on x.day = d::date)
  ) into v_result;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------
-- Maintenance: release stock held by unpaid orders (run from pg_cron — see README)
-- ---------------------------------------------------------------------
create or replace function public.expire_pending_orders(p_hours integer default 48)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
begin
  select coalesce(array_agg(id), '{}') into v_ids
    from public.orders
   where status = 'pending' and created_at < now() - make_interval(hours => p_hours);

  if cardinality(v_ids) = 0 then
    return 0;
  end if;

  update public.product_variants v
     set stock = v.stock + s.qty
    from (select variant_id, sum(quantity) qty from public.order_items
           where order_id = any (v_ids) and variant_id is not null group by variant_id) s
   where v.id = s.variant_id;

  update public.orders
     set status = 'rejected', rejected_at = now(),
         admin_note = 'Automatically cancelled: no payment slip received in time.'
   where id = any (v_ids);

  insert into public.order_status_history (order_id, status, note)
  select unnest(v_ids), 'rejected', 'Automatically cancelled: no payment slip received in time.';

  return cardinality(v_ids);
end;
$$;

-- Lock down function execution
revoke execute on function public.place_order(jsonb, text, text, text, text) from public, anon;
revoke execute on function public.attach_payment_slip(uuid, text) from public, anon;
revoke execute on function public.admin_update_order_status(uuid, public.order_status, text) from public, anon;
revoke execute on function public.admin_save_product(jsonb) from public, anon;
revoke execute on function public.admin_stats() from public, anon;
revoke execute on function public.expire_pending_orders(integer) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.refresh_product_aggregates() from public, anon, authenticated;
grant execute on function public.place_order(jsonb, text, text, text, text) to authenticated;
grant execute on function public.attach_payment_slip(uuid, text) to authenticated;
grant execute on function public.admin_update_order_status(uuid, public.order_status, text) to authenticated;
grant execute on function public.admin_save_product(jsonb) to authenticated;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.search_products(text, text, integer, integer, boolean, text, integer, integer, boolean) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Storage buckets & policies
-- Images are always re-encoded to WebP on the server before upload.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true,  2097152, array['image/webp']),
  ('payment-slips',  'payment-slips',  false, 2097152, array['image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Product images: public read via public URL; admins manage.
create policy "product_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product_images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

-- Payment slips: path = <user_id>/<order_id>/<file>.webp
-- Customers may upload only into their own folder, only for their own open order.
create policy "slips_customer_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-slips'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.orders o
       where o.id::text = (storage.foldername(name))[2]
         and o.user_id = (select auth.uid())
         and o.status in ('pending', 'slip_uploaded')
    )
  );

create policy "slips_read_own_or_admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-slips'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );

create policy "slips_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'payment-slips' and (select public.is_admin()));

-- ===================== 2. Storefront update =====================
-- =====================================================================
-- Storefront v2: search_products returns quick-add info and supports an
-- "on sale" filter. Safe to run on an existing database (replaces the
-- function; no data changes). Run after 20261102000000_init.sql.
-- =====================================================================

drop function if exists public.search_products(text, text, integer, integer, boolean, text, integer, integer, boolean);

create or replace function public.search_products(
  p_query      text    default null,
  p_category   text    default null,
  p_min_price  integer default null,
  p_max_price  integer default null,
  p_in_stock   boolean default false,
  p_sort       text    default 'newest',
  p_limit      integer default 24,
  p_offset     integer default 0,
  p_featured   boolean default false,
  p_on_sale    boolean default false
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_q      text := nullif(trim(left(p_query, 100)), '');
  v_like   text;
  v_tsq    tsquery;
  v_limit  integer := least(greatest(coalesce(p_limit, 24), 1), 60);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_result jsonb;
begin
  if v_q is not null then
    v_tsq  := websearch_to_tsquery('simple', v_q);
    v_like := '%' || replace(replace(replace(v_q, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;

  with filtered as (
    select p.id, p.name, p.slug, p.min_price, p.total_stock, p.created_at, p.is_featured,
           c.name as category_name, c.slug as category_slug,
           case when v_tsq is not null then ts_rank(p.search, v_tsq) else 0 end as rank
      from public.products p
      left join public.categories c on c.id = p.category_id
     where p.is_active
       and (v_q is null or p.search @@ v_tsq or p.name ilike v_like)
       and (p_category is null or c.slug = p_category)
       and (p_min_price is null or p.min_price >= p_min_price)
       and (p_max_price is null or p.min_price <= p_max_price)
       and (not coalesce(p_in_stock, false) or p.total_stock > 0)
       and (not coalesce(p_featured, false) or p.is_featured)
       and (not coalesce(p_on_sale, false) or exists (
             select 1 from public.product_variants v
              where v.product_id = p.id and v.compare_at_price > v.price))
  ),
  page as (
    select f.*,
           (select i.storage_path from public.product_images i
             where i.product_id = f.id order by i.position, i.created_at limit 1) as image_path,
           (select max(v.compare_at_price) from public.product_variants v
             where v.product_id = f.id and v.compare_at_price > v.price) as compare_at_price,
           (select count(*) from public.product_variants v where v.product_id = f.id)::integer as variant_count,
           (select v.id from public.product_variants v
             where v.product_id = f.id order by v.position, v.created_at limit 1) as default_variant_id,
           (select v.name from public.product_variants v
             where v.product_id = f.id order by v.position, v.created_at limit 1) as default_variant_name
      from filtered f
     order by
       case when p_sort = 'price_asc'  then f.min_price end asc nulls last,
       case when p_sort = 'price_desc' then f.min_price end desc nulls last,
       case when p_sort = 'name'       then f.name end asc,
       case when p_sort = 'relevance'  then f.rank end desc,
       f.created_at desc
     limit v_limit offset v_offset
  )
  select jsonb_build_object(
           'total', (select count(*) from filtered),
           'items', coalesce((select jsonb_agg(to_jsonb(pg) - 'rank') from page pg), '[]'::jsonb)
         )
    into v_result;

  return v_result;
end;
$$;

grant execute on function public.search_products(text, text, integer, integer, boolean, text, integer, integer, boolean, boolean) to anon, authenticated;

-- ===================== 3. Existing users =====================
insert into public.profiles (id, full_name, phone)
select id,
       left(nullif(trim(raw_user_meta_data ->> 'full_name'), ''), 120),
       left(nullif(trim(raw_user_meta_data ->> 'phone'), ''), 30)
from auth.users
on conflict (id) do nothing;
