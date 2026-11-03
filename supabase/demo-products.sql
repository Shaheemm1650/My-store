-- =====================================================================
-- Demo catalogue: 7 categories, 27 products with real photos.
-- Supabase → SQL Editor → New query → paste this whole file → Run.
-- Requires 1_tables.sql (and 2_functions.sql) to have been run first.
-- Safe to run more than once: existing categories/products are skipped.
-- Photos are served from the free DummyJSON demo catalogue
-- (https://dummyjson.com). Replace them with your own product photos
-- from the admin panel before going live.
-- Prices are in laari (MVR × 100), e.g. 45900 = MVR 459.00.
-- =====================================================================

insert into public.categories (name, slug, description, sort_order) values
  ('Clothing', 'clothing', 'Shirts, dresses and everyday wear', 1),
  ('Shoes', 'shoes', 'Heels, casual shoes and slippers', 2),
  ('Bags & Accessories', 'bags-accessories', 'Handbags, backpacks, watches, sunglasses and jewellery', 3),
  ('Home & Kitchen', 'home-kitchen', 'Décor, lighting and kitchen essentials', 4),
  ('Beauty', 'beauty', 'Makeup and nail care', 5),
  ('Sports', 'sports', 'Balls, rackets and gear', 6),
  ('Groceries', 'groceries', 'Pantry staples and drinks', 7)
on conflict (slug) do nothing;

-- Blue & Black Check Shirt
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Blue & Black Check Shirt', 'blue-and-black-check-shirt', 'A stylish and comfortable men''s shirt with a classic check pattern. Made from high-quality fabric, it suits both casual and semi-formal occasions.',
          (select id from public.categories where slug = 'clothing'), true)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('S', 'BLUBLACHE-S', 46900, 55900, 10, 0),
    ('M', 'BLUBLACHE-M', 46900, 55900, 10, 1),
    ('L', 'BLUBLACHE-L', 46900, 55900, 9, 2),
    ('XL', 'BLUBLACHE-XL', 46900, 55900, 9, 3)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Blue & Black Check Shirt', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/1.webp', 0),
  ('https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/2.webp', 1),
  ('https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/3.webp', 2),
  ('https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/4.webp', 3)
) as x(path, pos);

-- Men's Plaid Shirt
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Men''s Plaid Shirt', 'men-s-plaid-shirt', 'A timeless, versatile men''s shirt with a classic plaid pattern. Comfortable fit and casual style make it a wardrobe essential.',
          (select id from public.categories where slug = 'clothing'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('S', 'MENPLASHI-S', 53900, null::integer, 21, 0),
    ('M', 'MENPLASHI-M', 53900, null::integer, 21, 1),
    ('L', 'MENPLASHI-L', 53900, null::integer, 20, 2),
    ('XL', 'MENPLASHI-XL', 53900, null::integer, 20, 3)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Men''s Plaid Shirt', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/1.webp', 0),
  ('https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/2.webp', 1),
  ('https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/3.webp', 2),
  ('https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/4.webp', 3)
) as x(path, pos);

-- Summer Dress
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Summer Dress', 'summer-dress', 'A cute and breezy dress for warm weather. Playful patterns and lightweight fabric keep you cool and stylish all summer.',
          (select id from public.categories where slug = 'clothing'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('S', 'SUMDRE-S', 30900, 38900, 15, 0),
    ('M', 'SUMDRE-M', 30900, 38900, 14, 1),
    ('L', 'SUMDRE-L', 30900, 38900, 14, 2)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Summer Dress', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/tops/girl-summer-dress/1.webp', 0),
  ('https://cdn.dummyjson.com/product-images/tops/girl-summer-dress/2.webp', 1),
  ('https://cdn.dummyjson.com/product-images/tops/girl-summer-dress/3.webp', 2),
  ('https://cdn.dummyjson.com/product-images/tops/girl-summer-dress/4.webp', 3)
) as x(path, pos);

-- Gray Dress
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Gray Dress', 'gray-dress', 'A versatile, chic dress in a neutral gray that can be dressed up or down — a wardrobe staple.',
          (select id from public.categories where slug = 'clothing'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('S', 'GRADRE-S', 53900, null::integer, 19, 0),
    ('M', 'GRADRE-M', 53900, null::integer, 18, 1),
    ('L', 'GRADRE-L', 53900, null::integer, 18, 2)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Gray Dress', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/tops/gray-dress/1.webp', 0),
  ('https://cdn.dummyjson.com/product-images/tops/gray-dress/2.webp', 1),
  ('https://cdn.dummyjson.com/product-images/tops/gray-dress/3.webp', 2),
  ('https://cdn.dummyjson.com/product-images/tops/gray-dress/4.webp', 3)
) as x(path, pos);

-- Golden Heels
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Golden Heels', 'golden-heels', 'Glamorous golden heels for special occasions. A stylish design that adds a touch of luxury to any outfit.',
          (select id from public.categories where slug = 'shoes'), true)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('EU 37', 'GOLHEE-EU37', 77900, 90900, 22, 0),
    ('EU 38', 'GOLHEE-EU38', 77900, 90900, 22, 1),
    ('EU 39', 'GOLHEE-EU39', 77900, 90900, 22, 2),
    ('EU 40', 'GOLHEE-EU40', 77900, 90900, 22, 3)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Golden Heels', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/womens-shoes/golden-shoes-woman/1.webp', 0),
  ('https://cdn.dummyjson.com/product-images/womens-shoes/golden-shoes-woman/2.webp', 1),
  ('https://cdn.dummyjson.com/product-images/womens-shoes/golden-shoes-woman/3.webp', 2),
  ('https://cdn.dummyjson.com/product-images/womens-shoes/golden-shoes-woman/4.webp', 3)
) as x(path, pos);

-- Red Shoes
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Red Shoes', 'red-shoes', 'Make a bold statement with vibrant red shoes. Perfect for a party or a casual day out.',
          (select id from public.categories where slug = 'shoes'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('EU 37', 'REDSHO-EU37', 53900, 65900, 2, 0),
    ('EU 38', 'REDSHO-EU38', 53900, 65900, 2, 1),
    ('EU 39', 'REDSHO-EU39', 53900, 65900, 2, 2),
    ('EU 40', 'REDSHO-EU40', 53900, 65900, 1, 3)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Red Shoes', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/womens-shoes/red-shoes/1.webp', 0),
  ('https://cdn.dummyjson.com/product-images/womens-shoes/red-shoes/2.webp', 1),
  ('https://cdn.dummyjson.com/product-images/womens-shoes/red-shoes/3.webp', 2),
  ('https://cdn.dummyjson.com/product-images/womens-shoes/red-shoes/4.webp', 3)
) as x(path, pos);

-- Black & Brown Slippers
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Black & Brown Slippers', 'black-and-brown-slippers', 'Comfortable, stylish slippers in a blend of black and brown — perfect for relaxing at home.',
          (select id from public.categories where slug = 'shoes'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('EU 37', 'BLABROSLI-EU37', 30900, null::integer, 1, 0),
    ('EU 38', 'BLABROSLI-EU38', 30900, null::integer, 1, 1),
    ('EU 39', 'BLABROSLI-EU39', 30900, null::integer, 1, 2),
    ('EU 40', 'BLABROSLI-EU40', 30900, null::integer, 0, 3)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Black & Brown Slippers', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/womens-shoes/black-&-brown-slipper/1.webp', 0),
  ('https://cdn.dummyjson.com/product-images/womens-shoes/black-&-brown-slipper/2.webp', 1),
  ('https://cdn.dummyjson.com/product-images/womens-shoes/black-&-brown-slipper/3.webp', 2),
  ('https://cdn.dummyjson.com/product-images/womens-shoes/black-&-brown-slipper/4.webp', 3)
) as x(path, pos);

-- Blue Handbag
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Blue Handbag', 'blue-handbag', 'A stylish, spacious handbag in vibrant blue with multiple compartments for everyday use.',
          (select id from public.categories where slug = 'bags-accessories'), true)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'BLUHAN', 77900, 94900, 76, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Blue Handbag', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/womens-bags/blue-women''s-handbag/1.webp', 0),
  ('https://cdn.dummyjson.com/product-images/womens-bags/blue-women''s-handbag/2.webp', 1),
  ('https://cdn.dummyjson.com/product-images/womens-bags/blue-women''s-handbag/3.webp', 2)
) as x(path, pos);

-- White Faux Leather Backpack
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('White Faux Leather Backpack', 'white-faux-leather-backpack', 'A trendy, practical backpack with a sleek white design and plenty of room — great for everyday and travel.',
          (select id from public.categories where slug = 'bags-accessories'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'WHIFAULEA', 61900, 72900, 39, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'White Faux Leather Backpack', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/womens-bags/white-faux-leather-backpack/1.webp', 0),
  ('https://cdn.dummyjson.com/product-images/womens-bags/white-faux-leather-backpack/2.webp', 1),
  ('https://cdn.dummyjson.com/product-images/womens-bags/white-faux-leather-backpack/3.webp', 2)
) as x(path, pos);

-- Brown Leather Strap Watch
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Brown Leather Strap Watch', 'brown-leather-strap-watch', 'A classic timepiece with a genuine leather strap and a sleek dial that adds sophistication to your look.',
          (select id from public.categories where slug = 'bags-accessories'), true)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'BROLEASTR', 138900, null::integer, 32, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Brown Leather Strap Watch', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/mens-watches/brown-leather-belt-watch/1.webp', 0),
  ('https://cdn.dummyjson.com/product-images/mens-watches/brown-leather-belt-watch/2.webp', 1),
  ('https://cdn.dummyjson.com/product-images/mens-watches/brown-leather-belt-watch/3.webp', 2)
) as x(path, pos);

-- Black Sunglasses
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Black Sunglasses', 'black-sunglasses', 'Classic sunglasses with a sleek black frame and tinted lenses, offering UV protection and a timeless look.',
          (select id from public.categories where slug = 'bags-accessories'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'BLASUN', 46900, null::integer, 60, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Black Sunglasses', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/sunglasses/black-sun-glasses/1.webp', 0),
  ('https://cdn.dummyjson.com/product-images/sunglasses/black-sun-glasses/2.webp', 1),
  ('https://cdn.dummyjson.com/product-images/sunglasses/black-sun-glasses/3.webp', 2)
) as x(path, pos);

-- Green Crystal Earrings
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Green Crystal Earrings', 'green-crystal-earrings', 'Dazzling earrings featuring a vibrant green crystal — an elegant touch for formal and special occasions.',
          (select id from public.categories where slug = 'bags-accessories'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'GRECRYEAR', 46900, 55900, 54, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Green Crystal Earrings', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/womens-jewellery/green-crystal-earring/1.webp', 0),
  ('https://cdn.dummyjson.com/product-images/womens-jewellery/green-crystal-earring/2.webp', 1),
  ('https://cdn.dummyjson.com/product-images/womens-jewellery/green-crystal-earring/3.webp', 2)
) as x(path, pos);

-- Table Lamp
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Table Lamp', 'table-lamp', 'A modern table lamp providing both ambient and task lighting to brighten up any room.',
          (select id from public.categories where slug = 'home-kitchen'), true)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'TABLAM', 77900, null::integer, 9, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Table Lamp', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/home-decoration/table-lamp/1.webp', 0)
) as x(path, pos);

-- Plant Pot
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Plant Pot', 'plant-pot', 'A stylish pot for your favourite plants, with a sleek design for indoor or outdoor gardens.',
          (select id from public.categories where slug = 'home-kitchen'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'PLAPOT', 23900, null::integer, 59, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Plant Pot', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/home-decoration/plant-pot/1.webp', 0),
  ('https://cdn.dummyjson.com/product-images/home-decoration/plant-pot/2.webp', 1),
  ('https://cdn.dummyjson.com/product-images/home-decoration/plant-pot/3.webp', 2),
  ('https://cdn.dummyjson.com/product-images/home-decoration/plant-pot/4.webp', 3)
) as x(path, pos);

-- Countertop Blender
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Countertop Blender', 'countertop-blender', 'A powerful, compact blender for smoothies, shakes and more. Multiple speeds make it a versatile kitchen helper.',
          (select id from public.categories where slug = 'home-kitchen'), true)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'COUBLE', 61900, null::integer, 9, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Countertop Blender', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/kitchen-accessories/boxed-blender/1.webp', 0),
  ('https://cdn.dummyjson.com/product-images/kitchen-accessories/boxed-blender/2.webp', 1),
  ('https://cdn.dummyjson.com/product-images/kitchen-accessories/boxed-blender/3.webp', 2),
  ('https://cdn.dummyjson.com/product-images/kitchen-accessories/boxed-blender/4.webp', 3)
) as x(path, pos);

-- Carbon Steel Wok
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Carbon Steel Wok', 'carbon-steel-wok', 'A versatile wok for stir-frying, sautéing and deep frying, with sturdy construction for even heat.',
          (select id from public.categories where slug = 'home-kitchen'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'CARSTEWOK', 46900, null::integer, 40, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Carbon Steel Wok', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/kitchen-accessories/carbon-steel-wok/1.webp', 0)
) as x(path, pos);

-- Lunch Box
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Lunch Box', 'lunch-box', 'A convenient, portable lunch box with separate compartments — perfect for school, work or the beach.',
          (select id from public.categories where slug = 'home-kitchen'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'LUNBOX', 20900, 23900, 94, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Lunch Box', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/kitchen-accessories/lunch-box/1.webp', 0)
) as x(path, pos);

-- Eyeshadow Palette with Mirror
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Eyeshadow Palette with Mirror', 'eyeshadow-palette-with-mirror', 'A versatile range of eyeshadow shades with a built-in mirror for easy touch-ups on the go.',
          (select id from public.categories where slug = 'beauty'), true)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'EYEPALWIT', 30900, 37900, 34, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Eyeshadow Palette with Mirror', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/beauty/eyeshadow-palette-with-mirror/1.webp', 0)
) as x(path, pos);

-- Red Lipstick
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Red Lipstick', 'red-lipstick', 'A classic, bold red with a creamy, pigmented formula for a vibrant, long-lasting finish.',
          (select id from public.categories where slug = 'beauty'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'REDLIP', 20900, null::integer, 91, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Red Lipstick', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/beauty/red-lipstick/1.webp', 0)
) as x(path, pos);

-- Red Nail Polish
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Red Nail Polish', 'red-nail-polish', 'A rich, glossy red with a quick-drying formula for a salon-quality finish at home.',
          (select id from public.categories where slug = 'beauty'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'REDNAIPOL', 13900, 15900, 79, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Red Nail Polish', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/beauty/red-nail-polish/1.webp', 0)
) as x(path, pos);

-- Football
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Football', 'football', 'A standard size-5 football for training and matches on grass or turf.',
          (select id from public.categories where slug = 'sports'), true)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'FOO', 27900, null::integer, 96, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Football', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/sports-accessories/football/1.webp', 0)
) as x(path, pos);

-- Basketball
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Basketball', 'basketball', 'A durable basketball for dribbling, shooting and passing — suitable for indoor and outdoor courts.',
          (select id from public.categories where slug = 'sports'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'BAS', 23900, null::integer, 75, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Basketball', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/sports-accessories/basketball/1.webp', 0)
) as x(path, pos);

-- Tennis Racket
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Tennis Racket', 'tennis-racket', 'A lightweight tennis racket with a comfortable grip, ideal for beginners and club players.',
          (select id from public.categories where slug = 'sports'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'TENRAC', 77900, 96900, 6, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Tennis Racket', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/sports-accessories/tennis-racket/1.webp', 0)
) as x(path, pos);

-- Volleyball
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Volleyball', 'volleyball', 'A standard volleyball for passing, setting and spiking — great for the beach or the court.',
          (select id from public.categories where slug = 'sports'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'VOL', 18900, null::integer, 0, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Volleyball', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/sports-accessories/volleyball/1.webp', 0)
) as x(path, pos);

-- Pure Honey Jar
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Pure Honey Jar', 'pure-honey-jar', 'Pure, natural honey — perfect for sweetening tea or drizzling over breakfast.',
          (select id from public.categories where slug = 'groceries'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'PURHONJAR', 10900, null::integer, 34, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Pure Honey Jar', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/groceries/honey-jar/1.webp', 0)
) as x(path, pos);

-- Rice
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Rice', 'rice', 'High-quality long-grain rice, a versatile staple for everyday cooking.',
          (select id from public.categories where slug = 'groceries'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'RIC', 9900, null::integer, 59, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Rice', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/groceries/rice/1.webp', 0)
) as x(path, pos);

-- Fruit Juice
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Fruit Juice', 'fruit-juice', 'Refreshing fruit juice packed with vitamins — great for staying hydrated.',
          (select id from public.categories where slug = 'groceries'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'FRUJUI', 6900, 7900, 50, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Fruit Juice', 600, 600, x.pos
from p, (values
  ('https://cdn.dummyjson.com/product-images/groceries/juice/1.webp', 0)
) as x(path, pos);
