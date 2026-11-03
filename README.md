# Online Store — Next.js 16 + Supabase

A production-ready online store with bank-transfer payments (customers upload a payment slip), built with the Next.js App Router, Supabase (Postgres, Auth, Storage) and Tailwind CSS v4. Deploys to Vercel.

## Features

**Storefront**
- Home page with featured products, new arrivals and categories
- Product listing with full-text search, category / price / in-stock filters, sorting and pagination
- Product page with image gallery, variants (size, colour…), live stock, sale prices and SEO structured data
- Cart (saved in the browser, re-synced with live prices/stock on every visit)
- Checkout (sign-in required) → order created with **server-calculated prices** and **atomically reserved stock**
- Order page with bank details, payment slip upload (auto-compressed) and a status timeline

**Order statuses:** `pending` → `slip_uploaded` → `approved` → `delivered`, or `rejected` (reserved stock is returned automatically).

**Admin (`/admin`)**
- Dashboard: revenue, orders by status, 14-day revenue chart, customers, low-stock alerts, recent orders
- Products: create/edit/delete, variants with SKU / price / compare-at price / stock, multiple images (reorder, set cover, delete), visibility & featured flags
- Categories: add / edit / delete
- Orders: filter by status, search by order #/name/phone, view slip, approve / reject (with reason) / mark delivered

## Image compression

Images never go into the database — they're stored in Supabase Storage and only the path is saved. Every image is compressed twice:

1. **In the browser** (`browser-image-compression`) to ~1 MB / 2000 px before upload — fast on mobile data and well under Vercel's 4.5 MB request limit.
2. **On the server** (`sharp`) — the image is decoded (proving it's a real image), auto-rotated, **stripped of EXIF/GPS metadata**, resized to max 1600 px and re-encoded as WebP (products q80, slips q72). Typical result: **80–300 KB**.

Storage buckets only accept `image/webp` up to 2 MB, so nothing else can be stored even if someone bypasses the app.

## Security

- **Row Level Security on every table.** Customers can only read their own orders; catalog writes require the `admin` role. No service-role key is used anywhere in the app.
- **All order writes go through Postgres functions** (`place_order`, `attach_payment_slip`, `admin_update_order_status`) that enforce ownership, valid status transitions and stock, so the browser can't tamper with prices, totals or statuses.
- Users cannot change their own role (column-level privileges).
- Payment slips are in a **private** bucket, readable only by the owner and admins via 10-minute signed URLs. Customers can only upload into their own folder, for their own open order.
- Abuse guard: max 5 unpaid orders per account (prevents stock hoarding).
- Strict **nonce-based Content Security Policy**, HSTS, `X-Frame-Options: DENY`, `nosniff`, referrer & permissions policies.
- All inputs validated with **Zod** on the server; open-redirect-safe `next` parameters; Server Actions have built-in CSRF origin checks.
- Sessions verified server-side (`getClaims` in the proxy, `getUser` for data access).

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. **Quickest:** open **SQL Editor** and run the whole of `supabase/setup-all.sql` once (tables, security, storage, deals update and sample products in one go). Or, step by step: run `supabase/migrations/20261102000000_init.sql` (creates tables, functions, RLS policies and storage buckets).
   Then run `supabase/migrations/20261103000000_storefront_v2.sql` (adds deals filtering and one-click add-to-cart).
3. Optional: run `supabase/demo-products.sql` for 27 demo products in 7 categories with real photos (served from the free DummyJSON demo catalogue), and/or `supabase/seed.sql` to add 5 categories and 18 sample products (with variants, stock, sale prices and images). The sample images ship in `public/samples/`, so they work without uploading anything. Delete the products from the admin panel when you add your real catalog.
4. **Authentication → URL Configuration:** set *Site URL* to your domain (e.g. `https://yourstore.vercel.app`) and add `http://localhost:3000/**` and `https://yourstore.vercel.app/**` to *Redirect URLs*.
5. Recommended — **Authentication → Email Templates → Confirm signup**, use:
   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
   ```
   (The default template also works.)

### 2. Run locally
```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + publishable/anon key and bank details
npm run dev
```

### 3. Make yourself an admin
Sign up in the app, then run in the SQL Editor:
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```
Sign out and back in, then open `/admin`.

### 4. Deploy to Vercel
1. Push to GitHub and import the repo in Vercel.
2. Add the environment variables from `.env.example` (set `NEXT_PUBLIC_SITE_URL` to your production URL).
3. Deploy. Update Supabase's Site URL / Redirect URLs to match.

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`) or legacy anon key |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the site (used for SEO and email links) |
| `NEXT_PUBLIC_STORE_NAME` | Store name shown in the UI |
| `NEXT_PUBLIC_CURRENCY` | ISO currency code, e.g. `MVR`, `USD` |
| `NEXT_PUBLIC_LOCALE` | Number/date locale, e.g. `en-MV` |
| `BANK_NAME`, `BANK_ACCOUNT_NAME`, `BANK_ACCOUNT_NUMBER` | Shown to customers on the order page (server-only) |

## Project structure

```
supabase/migrations/   Database schema, RLS, RPC functions, storage policies
supabase/seed.sql      Sample data
src/proxy.ts           Session refresh, route protection, CSP nonce (Next 16 "proxy", formerly middleware)
src/actions/           Server Actions (auth, checkout, slip upload, admin)
src/app/(store)/       Storefront pages
src/app/(auth)/        Login / signup
src/app/admin/         Admin dashboard
src/components/        UI components (store/, admin/, ui/)
src/lib/               Supabase clients, auth helpers, validation, image processing
```

## Notes & next steps

- Money is stored as integer minor units (e.g. 199.00 → `19900`) to avoid rounding errors.
- Delivery is free by default (`orders.shipping_fee` exists if you want to add fees later).
- Unpaid `pending` orders hold stock until rejected. To release it automatically, enable the **pg_cron** extension (Database → Extensions) and run:
  ```sql
  select cron.schedule('expire-unpaid-orders', '0 * * * *', $$select public.expire_pending_orders(48)$$);
  ```
  This rejects orders still `pending` after 48 hours and returns their stock.
- Scripts: `npm run lint`, `npm run typecheck`, `npm run build`.
- For typed queries, generate types with `npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts`.
