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
