-- Private bucket for admin-uploaded product images (served via signed URLs).
-- Lovable Cloud created this outside the migrations; the policies already exist in
-- 20261023194456_product_image_storage_policies.sql.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', false)
on conflict (id) do nothing;
