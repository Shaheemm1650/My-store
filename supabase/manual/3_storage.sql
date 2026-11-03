-- =====================================================================
-- STEP 3 of 3 — Storage buckets for product images and payment slips (run after step 2)
-- Supabase → SQL Editor → New query → paste this whole file → Run.
-- Safe to run more than once.
-- =====================================================================

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
drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));
drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

-- Payment slips: path = <user_id>/<order_id>/<file>.webp
-- Customers may upload only into their own folder, only for their own open order.
drop policy if exists "slips_customer_insert" on storage.objects;
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

drop policy if exists "slips_read_own_or_admin" on storage.objects;
create policy "slips_read_own_or_admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-slips'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );

drop policy if exists "slips_admin_delete" on storage.objects;
create policy "slips_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'payment-slips' and (select public.is_admin()));

-- Tell the Supabase API to pick up the new functions immediately.
notify pgrst, 'reload schema';
