-- =====================================================================
-- Sample data: 5 categories, 18 products with variants and images.
-- Safe to re-run: existing categories/products (matched by slug) are skipped.
-- Sample images live in /public/samples and are served by the app itself;
-- images you upload from the admin panel go to Supabase Storage as usual.
-- Prices are in minor units (19900 = 199.00).
-- =====================================================================

insert into public.categories (name, slug, description, sort_order) values
  ('Clothing', 'clothing', 'T-shirts, shirts and hoodies for island life', 1),
  ('Accessories', 'accessories', 'Bags, eyewear, watches and everyday carry', 2),
  ('Home & Kitchen', 'home-kitchen', 'Mugs, bottles, lighting and more', 3),
  ('Electronics', 'electronics', 'Audio and charging essentials', 4),
  ('Sports & Outdoors', 'sports-outdoors', 'Gear for the gym, the run and the reef', 5)
on conflict (slug) do nothing;

-- Classic Cotton Tee
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Classic Cotton Tee', 'classic-cotton-tee', 'A soft, breathable 100% cotton t-shirt with a relaxed fit. Pre-shrunk and garment-washed for a lived-in feel from day one.

• 180 gsm combed cotton
• Ribbed crew neck
• Machine washable',
          (select id from public.categories where slug = 'clothing'), true)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Small', 'TEE-S', 19900, 24900, 12, 0),
    ('Medium', 'TEE-M', 19900, 24900, 20, 1),
    ('Large', 'TEE-L', 19900, 24900, 15, 2),
    ('XL', 'TEE-XL', 21900, null::integer, 4, 3)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Classic Cotton Tee', 800, 800, x.pos
from p, (values
  ('/samples/classic-cotton-tee-1.webp', 0),
  ('/samples/classic-cotton-tee-2.webp', 1)
) as x(path, pos);

-- Linen Button-Up Shirt
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Linen Button-Up Shirt', 'linen-button-up-shirt', 'Lightweight linen shirt that stays cool in the tropical heat. Relaxed cut with a classic collar and coconut buttons.',
          (select id from public.categories where slug = 'clothing'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Small', 'LIN-S', 44900, null::integer, 6, 0),
    ('Medium', 'LIN-M', 44900, null::integer, 9, 1),
    ('Large', 'LIN-L', 44900, null::integer, 0, 2)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Linen Button-Up Shirt', 800, 800, x.pos
from p, (values
  ('/samples/linen-button-up-shirt-1.webp', 0),
  ('/samples/linen-button-up-shirt-2.webp', 1)
) as x(path, pos);

-- Everyday Hoodie
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Everyday Hoodie', 'everyday-hoodie', 'Midweight fleece hoodie with a brushed interior, kangaroo pocket and adjustable hood. Perfect for air-conditioned offices and ferry rides.',
          (select id from public.categories where slug = 'clothing'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Medium', 'HOOD-M', 59900, 69900, 8, 0),
    ('Large', 'HOOD-L', 59900, 69900, 10, 1),
    ('XL', 'HOOD-XL', 62900, 72900, 5, 2)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Everyday Hoodie', 800, 800, x.pos
from p, (values
  ('/samples/everyday-hoodie-1.webp', 0),
  ('/samples/everyday-hoodie-2.webp', 1)
) as x(path, pos);

-- Canvas Tote Bag
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Canvas Tote Bag', 'canvas-tote-bag', 'Heavy-duty 12 oz canvas tote with long shoulder straps and an inner zip pocket. Carries groceries, books or beach gear.',
          (select id from public.categories where slug = 'accessories'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Natural', 'TOTE-NAT', 14900, null::integer, 30, 0),
    ('Black', 'TOTE-BLK', 14900, null::integer, 18, 1)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Canvas Tote Bag', 800, 800, x.pos
from p, (values
  ('/samples/canvas-tote-bag-1.webp', 0),
  ('/samples/canvas-tote-bag-2.webp', 1)
) as x(path, pos);

-- Travel Backpack 25L
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Travel Backpack 25L', 'travel-backpack-25l', 'Water-resistant 25-litre backpack with a padded 15" laptop sleeve, quick-access top pocket and luggage pass-through.

• Recycled polyester shell
• YKK zips
• Fits under most airline seats',
          (select id from public.categories where slug = 'accessories'), true)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Navy', 'BP25-NVY', 89900, 109900, 7, 0),
    ('Charcoal', 'BP25-CHR', 89900, 109900, 11, 1)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Travel Backpack 25L', 800, 800, x.pos
from p, (values
  ('/samples/travel-backpack-25l-1.webp', 0),
  ('/samples/travel-backpack-25l-2.webp', 1)
) as x(path, pos);

-- Polarized Sunglasses
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Polarized Sunglasses', 'polarized-sunglasses', 'UV400 polarized lenses cut glare off the water. Lightweight acetate frame with spring hinges. Includes a hard case and cloth.',
          (select id from public.categories where slug = 'accessories'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Matte Black', 'SUN-BLK', 34900, null::integer, 14, 0),
    ('Tortoise', 'SUN-TRT', 34900, null::integer, 9, 1)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Polarized Sunglasses', 800, 800, x.pos
from p, (values
  ('/samples/polarized-sunglasses-1.webp', 0),
  ('/samples/polarized-sunglasses-2.webp', 1)
) as x(path, pos);

-- Minimal Analog Watch
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Minimal Analog Watch', 'minimal-analog-watch', 'Clean 40 mm dial, sapphire-coated glass and Japanese quartz movement. 50 m water resistant with a quick-release strap.',
          (select id from public.categories where slug = 'accessories'), true)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Black', 'WCH-BLK', 129900, null::integer, 5, 0),
    ('Silver', 'WCH-SLV', 129900, null::integer, 3, 1)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Minimal Analog Watch', 800, 800, x.pos
from p, (values
  ('/samples/minimal-analog-watch-1.webp', 0),
  ('/samples/minimal-analog-watch-2.webp', 1)
) as x(path, pos);

-- Slim Leather Wallet
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Slim Leather Wallet', 'leather-wallet', 'Full-grain leather bifold with six card slots and a cash compartment. RFID-blocking lining keeps your cards safe.',
          (select id from public.categories where slug = 'accessories'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'WAL-BRN', 39900, null::integer, 16, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Slim Leather Wallet', 800, 800, x.pos
from p, (values
  ('/samples/leather-wallet-1.webp', 0),
  ('/samples/leather-wallet-2.webp', 1)
) as x(path, pos);

-- Ceramic Coffee Mug 350ml
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Ceramic Coffee Mug 350ml', 'ceramic-coffee-mug', 'Stoneware mug with a satin glaze and a comfortable handle. Microwave and dishwasher safe.',
          (select id from public.categories where slug = 'home-kitchen'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('White', 'MUG-WHT', 9900, null::integer, 40, 0),
    ('Sand', 'MUG-SND', 9900, null::integer, 25, 1)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Ceramic Coffee Mug 350ml', 800, 800, x.pos
from p, (values
  ('/samples/ceramic-coffee-mug-1.webp', 0),
  ('/samples/ceramic-coffee-mug-2.webp', 1)
) as x(path, pos);

-- Insulated Water Bottle 750ml
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Insulated Water Bottle 750ml', 'insulated-water-bottle', 'Double-wall vacuum-insulated stainless steel. Keeps drinks cold for 24 hours or hot for 12. Leak-proof lid, BPA-free.',
          (select id from public.categories where slug = 'home-kitchen'), true)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Ocean Blue', 'BTL-BLU', 27900, 32900, 22, 0),
    ('Black', 'BTL-BLK', 27900, 32900, 18, 1),
    ('White', 'BTL-WHT', 27900, 32900, 0, 2)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Insulated Water Bottle 750ml', 800, 800, x.pos
from p, (values
  ('/samples/insulated-water-bottle-1.webp', 0),
  ('/samples/insulated-water-bottle-2.webp', 1),
  ('/samples/insulated-water-bottle-3.webp', 2)
) as x(path, pos);

-- Bedside Table Lamp
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Bedside Table Lamp', 'bedside-table-lamp', 'Warm-white LED desk lamp with an adjustable arm and three brightness levels. USB-C powered.',
          (select id from public.categories where slug = 'home-kitchen'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'LMP-01', 54900, null::integer, 8, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Bedside Table Lamp', 800, 800, x.pos
from p, (values
  ('/samples/bedside-table-lamp-1.webp', 0),
  ('/samples/bedside-table-lamp-2.webp', 1)
) as x(path, pos);

-- Scented Soy Candle
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Scented Soy Candle', 'scented-soy-candle', 'Hand-poured soy wax candle with a cotton wick. Around 40 hours of clean burn time.',
          (select id from public.categories where slug = 'home-kitchen'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Vanilla', 'CND-VAN', 12900, null::integer, 24, 0),
    ('Ocean Breeze', 'CND-OCN', 12900, null::integer, 19, 1)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Scented Soy Candle', 800, 800, x.pos
from p, (values
  ('/samples/scented-soy-candle-1.webp', 0),
  ('/samples/scented-soy-candle-2.webp', 1)
) as x(path, pos);

-- Wireless Earbuds
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Wireless Earbuds', 'wireless-earbuds', 'Active noise cancelling earbuds with up to 30 hours of playback with the case, IPX4 sweat resistance and fast USB-C charging.',
          (select id from public.categories where slug = 'electronics'), true)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('White', 'EAR-WHT', 79900, 99900, 10, 0),
    ('Black', 'EAR-BLK', 79900, 99900, 6, 1)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Wireless Earbuds', 800, 800, x.pos
from p, (values
  ('/samples/wireless-earbuds-1.webp', 0),
  ('/samples/wireless-earbuds-2.webp', 1)
) as x(path, pos);

-- 10,000mAh Power Bank
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('10,000mAh Power Bank', 'power-bank-10000', 'Pocket-size power bank with 20 W USB-C PD fast charging. Charges most phones twice.',
          (select id from public.categories where slug = 'electronics'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'PWR-10K', 34900, null::integer, 27, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, '10,000mAh Power Bank', 800, 800, x.pos
from p, (values
  ('/samples/power-bank-10000-1.webp', 0),
  ('/samples/power-bank-10000-2.webp', 1)
) as x(path, pos);

-- Portable Bluetooth Speaker
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Portable Bluetooth Speaker', 'portable-bluetooth-speaker', 'Waterproof (IP67) speaker with rich 360° sound and 12-hour battery. Floats, so it''s safe by the pool or on the boat.',
          (select id from public.categories where slug = 'electronics'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Coral', 'SPK-CRL', 64900, null::integer, 9, 0),
    ('Midnight', 'SPK-MID', 64900, null::integer, 7, 1)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Portable Bluetooth Speaker', 800, 800, x.pos
from p, (values
  ('/samples/portable-bluetooth-speaker-1.webp', 0),
  ('/samples/portable-bluetooth-speaker-2.webp', 1)
) as x(path, pos);

-- Adjustable Dumbbell Set
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Adjustable Dumbbell Set', 'adjustable-dumbbell-set', 'Pair of adjustable dumbbells from 2.5 to 12.5 kg each. Quick-lock collars and knurled grips for a secure hold.',
          (select id from public.categories where slug = 'sports-outdoors'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('Default', 'DMB-SET', 149900, null::integer, 4, 0)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Adjustable Dumbbell Set', 800, 800, x.pos
from p, (values
  ('/samples/adjustable-dumbbell-set-1.webp', 0),
  ('/samples/adjustable-dumbbell-set-2.webp', 1)
) as x(path, pos);

-- Lightweight Running Shoes
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Lightweight Running Shoes', 'running-shoes', 'Breathable knit upper with responsive foam cushioning and a grippy rubber outsole for road and track.',
          (select id from public.categories where slug = 'sports-outdoors'), true)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('EU 40', 'RUN-40', 89900, 109900, 5, 0),
    ('EU 41', 'RUN-41', 89900, 109900, 8, 1),
    ('EU 42', 'RUN-42', 89900, 109900, 9, 2),
    ('EU 43', 'RUN-43', 89900, 109900, 6, 3),
    ('EU 44', 'RUN-44', 89900, 109900, 2, 4)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Lightweight Running Shoes', 800, 800, x.pos
from p, (values
  ('/samples/running-shoes-1.webp', 0),
  ('/samples/running-shoes-2.webp', 1)
) as x(path, pos);

-- Snorkel Mask & Fin Set
with p as (
  insert into public.products (name, slug, description, category_id, is_featured)
  values ('Snorkel Mask & Fin Set', 'snorkel-set', 'Tempered-glass mask, dry-top snorkel and adjustable fins in a mesh carry bag. Everything you need for the house reef.',
          (select id from public.categories where slug = 'sports-outdoors'), false)
  on conflict (slug) do nothing
  returning id
), v as (
  insert into public.product_variants (product_id, name, sku, price, compare_at_price, stock, position)
  select p.id, x.name, x.sku, x.price, x.compare_at, x.stock, x.pos
  from p, (values
    ('S/M', 'SNK-SM', 49900, null::integer, 10, 0),
    ('L/XL', 'SNK-LX', 49900, null::integer, 7, 1)
  ) as x(name, sku, price, compare_at, stock, pos)
  returning 1
)
insert into public.product_images (product_id, storage_path, alt, width, height, position)
select p.id, x.path, 'Snorkel Mask & Fin Set', 800, 800, x.pos
from p, (values
  ('/samples/snorkel-set-1.webp', 0),
  ('/samples/snorkel-set-2.webp', 1)
) as x(path, pos);
