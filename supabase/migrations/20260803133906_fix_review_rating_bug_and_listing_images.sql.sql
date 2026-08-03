/*
# Fix update_dealer_rating ambiguous column + listings image storage

## Summary
Fixes 3 issues:

### 1. Ambiguous `review_count` in update_dealer_rating (Critical Bug)
The PostgreSQL function `update_dealer_rating()` declared a local variable
named `review_count` (same name as the `profiles.review_count` column).
When the UPDATE referenced `review_count = COALESCE(review_count, 0)`,
PostgreSQL couldn't determine which `review_count` was meant — the local
variable or the column — and threw:
  `column reference "review_count" is ambiguous`

Fix: Rename the local variable to `v_review_count` throughout the function.

### 2. Profile INSERT policy (ensure new users can write their own row)
The `profiles` table previously had SELECT and UPDATE policies but no explicit
INSERT policy. The `handle_new_user` trigger runs as the triggering role
(SECURITY INVOKER by default), but to be safe we add an INSERT policy for
authenticated users so the row-level security never silently blocks profile
creation through other code paths.

### 3. Listings image upload storage bucket
Creates a `listing-images` storage bucket (public) so dealers can upload
custom photographs for each livestock batch. Adds storage policies so
authenticated dealers can upload images into their own folder, and everyone
can read them publicly.
*/

-- 1. Fix the ambiguous review_count variable in update_dealer_rating
CREATE OR REPLACE FUNCTION public.update_dealer_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_quality  numeric(3,1);
  v_avg_service  numeric(3,1);
  v_review_count int;
BEGIN
  SELECT
    ROUND(AVG(quality_rating)::numeric, 1),
    ROUND(AVG(service_rating)::numeric, 1),
    COUNT(*)
  INTO v_avg_quality, v_avg_service, v_review_count
  FROM reviews
  WHERE dealer_id = NEW.dealer_id;

  UPDATE profiles
  SET quality_rating = COALESCE(v_avg_quality, 0),
      service_rating = COALESCE(v_avg_service, 0),
      review_count   = COALESCE(v_review_count, 0)
  WHERE id = NEW.dealer_id;

  RETURN NEW;
END;
$$;

-- Re-attach trigger in case the function was dropped/recreated without it
DROP TRIGGER IF EXISTS on_review_inserted ON reviews;
CREATE TRIGGER on_review_inserted
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_dealer_rating();

-- 2. Add INSERT policy for profiles (for completeness / direct inserts)
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. Listing images storage bucket (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "read_listing_images" ON storage.objects;
CREATE POLICY "read_listing_images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "upload_listing_image" ON storage.objects;
CREATE POLICY "upload_listing_image"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "update_listing_image" ON storage.objects;
CREATE POLICY "update_listing_image"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "delete_listing_image" ON storage.objects;
CREATE POLICY "delete_listing_image"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );