/*
# Feature migration: avatar_url, address templates, dealer reminders, RLS fixes

## Summary
This migration adds support for profile avatars, buyer address templates,
dealer-to-buyer reminders, and fixes critical RLS policy gaps that were
preventing rating submissions from working.

## 1. New Columns
- `profiles.avatar_url` (text, nullable) — URL to the user's profile picture
  stored in Supabase Storage. Accessible to all account roles (buyers + dealers).

## 2. New Tables
- `address_templates` — Saved shipping/contact templates for buyers (like
  Shopee/TikTok address templates). Each buyer can save multiple templates
  with full name, phone, region, province, municipality (barangay), and
  detailed address. One can be marked as default.
  Columns:
    - id (uuid PK)
    - user_id (uuid FK → auth.users, NOT NULL DEFAULT auth.uid())
    - label (text, e.g. "Home", "Farm")
    - full_name (text)
    - phone_number (text)
    - region (text)
    - province (text)
    - municipality (text, used for barangay/municipality)
    - detailed_address (text, street/house number etc.)
    - is_default (boolean, default false)
    - created_at (timestamptz)

## 3. RLS Policy Fixes (Critical)
- `offers` table: previously had NO UPDATE policy. This caused the rating
  flow to fail silently — submitReview() tried to set `rated = true` on the
  offer row, but RLS blocked the update. Added `update_own_offers` policy
  allowing buyer or dealer to update offers they own.
- `reviews` table: previously had NO UPDATE policy. Added `update_own_reviews`
  allowing the review author to update their own review.
- `notifications` table: INSERT policy required `auth.uid() = user_id`, which
  is correct for self-notifications. The dealer reminder RPC will insert as
  SECURITY DEFINER (service role), so it bypasses RLS. No change needed.

## 4. New RPC Function
- `send_dealer_reminder(p_offer_id, p_message)` — SECURITY DEFINER function
  that lets a dealer send a custom reminder/notification to the buyer of a
  specific offer. Validates that the caller is the dealer on the offer,
  then inserts a notification row with type 'dealer_reminder' for the buyer.
  Returns the notification id on success.

## 5. Notification Type Expansion
- The `notifications.type` column is text, so 'dealer_reminder' is supported
  without schema changes. The frontend type union is updated separately.

## 6. Storage Bucket
- Creates a public storage bucket 'avatars' for profile picture uploads.
  Adds policies allowing authenticated users to upload/read their own avatar.

## 7. Security Changes
- RLS enabled on `address_templates` (owner-scoped CRUD).
- New UPDATE policies on `offers` and `reviews`.
- SECURITY DEFINER function `send_dealer_reminder` with EXECUTE granted to
  authenticated only (not anon).
*/

-- 1. Add avatar_url to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Create address_templates table
CREATE TABLE IF NOT EXISTS address_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  full_name text NOT NULL,
  phone_number text NOT NULL,
  region text NOT NULL,
  province text NOT NULL,
  municipality text NOT NULL,
  detailed_address text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE address_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_templates" ON address_templates;
CREATE POLICY "select_own_templates"
  ON address_templates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_templates" ON address_templates;
CREATE POLICY "insert_own_templates"
  ON address_templates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_templates" ON address_templates;
CREATE POLICY "update_own_templates"
  ON address_templates FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_templates" ON address_templates;
CREATE POLICY "delete_own_templates"
  ON address_templates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 3. Fix critical RLS gap: offers UPDATE policy
DROP POLICY IF EXISTS "update_own_offers" ON offers;
CREATE POLICY "update_own_offers"
  ON offers FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = dealer_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = dealer_id);

-- 4. Fix critical RLS gap: reviews UPDATE policy
DROP POLICY IF EXISTS "update_own_reviews" ON reviews;
CREATE POLICY "update_own_reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

-- 5. send_dealer_reminder RPC
CREATE OR REPLACE FUNCTION public.send_dealer_reminder(
  p_offer_id uuid,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer RECORD;
  v_notification_id uuid;
BEGIN
  -- Load the offer and verify the caller is the dealer
  SELECT buyer_id, dealer_id, listing_id INTO v_offer
  FROM offers WHERE id = p_offer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  IF v_offer.dealer_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized: only the dealer can send reminders for this offer';
  END IF;

  IF p_message IS NULL OR btrim(p_message) = '' THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;

  -- Insert notification for the buyer
  INSERT INTO notifications (user_id, type, title, message, offer_id)
  VALUES (v_offer.buyer_id, 'dealer_reminder', 'Dealer Reminder', p_message, p_offer_id)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Grant execute only to authenticated (not anon) since it requires auth.uid()
REVOKE ALL ON FUNCTION public.send_dealer_reminder(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.send_dealer_reminder(uuid, text) TO authenticated;

-- 6. Create avatars storage bucket (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
DROP POLICY IF EXISTS "read_avatars" ON storage.objects;
CREATE POLICY "read_avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "upload_own_avatar" ON storage.objects;
CREATE POLICY "upload_own_avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "update_own_avatar" ON storage.objects;
CREATE POLICY "update_own_avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "delete_own_avatar" ON storage.objects;
CREATE POLICY "delete_own_avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Index for address template lookups
CREATE INDEX IF NOT EXISTS idx_address_templates_user_id ON address_templates(user_id);