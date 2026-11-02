-- Optional sample data. Upload product images from the admin panel afterwards.
insert into public.categories (name, slug, description, sort_order) values
  ('Clothing', 'clothing', 'T-shirts, shirts and more', 1),
  ('Accessories', 'accessories', 'Bags, caps and everyday carry', 2),
  ('Home', 'home', 'Things for your space', 3)
on conflict (slug) do nothing;

with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Classic Cotton Tee', 'classic-cotton-tee',
          'A soft, breathable 100% cotton t-shirt with a relaxed fit.',
          (select id from public.categories where slug = 'clothing'), true)
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
select p.id, v.name, v.sku, v.price, v.compare_at, v.stock, v.pos
from p, (values
  ('Small',  'TEE-S', 19900, 24900, 10, 0),
  ('Medium', 'TEE-M', 19900, 24900, 15, 1),
  ('Large',  'TEE-L', 21900, null,   5, 2)
) as v(name, sku, price, compare_at, stock, pos);

with p as (
  insert into public.products (name, slug, description, category_id)
  values ('Canvas Tote Bag', 'canvas-tote-bag', 'Heavy-duty canvas tote with an inner pocket.',
          (select id from public.categories where slug = 'accessories'))
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, name, sku, price, stock)
select p.id, 'Natural', 'TOTE-NAT', 14900, 20 from p;
