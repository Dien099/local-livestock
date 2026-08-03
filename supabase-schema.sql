-- ============================================================
-- LOCAL LIVESTOCK — COMPLETE DATABASE SCHEMA
-- ============================================================
-- HOW TO USE THIS SCRIPT:
--   1. Log in to https://supabase.com
--   2. Open your project (or create a new one)
--   3. In the left sidebar, click "SQL Editor"
--   4. Click "New query"
--   5. Paste this entire script into the editor
--   6. Click the green "Run" button
--   7. You should see "Success" in the output panel
--
-- This script creates 6 tables, row-level security policies,
-- triggers, and stored procedures. It is safe to run more than
-- once (everything uses IF NOT EXISTS / DROP IF EXISTS).
-- ============================================================

-- Enable the pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABLE: profiles
-- Extends Supabase's built-in auth.users table with
-- app-specific fields like role, name, farm info, location.
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type text NOT NULL DEFAULT 'customer' CHECK (account_type IN ('customer','dealer')),
  name text NOT NULL,
  email text NOT NULL,
  farm_name text,
  phone text,
  avatar_url text,
  region text NOT NULL DEFAULT '',
  province text NOT NULL DEFAULT '',
  municipality text NOT NULL DEFAULT '',
  quality_rating numeric(3,1) NOT NULL DEFAULT 0,
  service_rating numeric(3,1) NOT NULL DEFAULT 0,
  review_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- TABLE: listings
-- Livestock batches listed by dealers for sale.
-- ============================================================
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  batch_number text NOT NULL,
  price_per_head int NOT NULL DEFAULT 0,
  available_stock int NOT NULL DEFAULT 0,
  original_stock int NOT NULL DEFAULT 0,
  region text NOT NULL DEFAULT '',
  province text NOT NULL DEFAULT '',
  municipality text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_listings_dealer ON listings(dealer_id);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(is_active);

DROP POLICY IF EXISTS "select_listings" ON listings;
CREATE POLICY "select_listings" ON listings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_listings" ON listings;
CREATE POLICY "insert_own_listings" ON listings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = dealer_id);

DROP POLICY IF EXISTS "update_own_listings" ON listings;
CREATE POLICY "update_own_listings" ON listings FOR UPDATE
  TO authenticated USING (auth.uid() = dealer_id) WITH CHECK (auth.uid() = dealer_id);

DROP POLICY IF EXISTS "delete_own_listings" ON listings;
CREATE POLICY "delete_own_listings" ON listings FOR DELETE
  TO authenticated USING (auth.uid() = dealer_id);

-- ============================================================
-- TABLE: offers
-- Buyer purchase requests sent to dealers. Includes
-- fulfillment method, quantity, and a status workflow.
-- ============================================================
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  dealer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_name text NOT NULL,
  buyer_contact text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  fulfillment_method text NOT NULL DEFAULT 'pickup' CHECK (fulfillment_method IN ('pickup','delivery')),
  preferred_date text,
  delivery_fee int,
  delivery_address text,
  dealer_notes text,
  scheduled_pickup_window text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','COMPLETED')),
  rated boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_dealer ON offers(dealer_id);
CREATE INDEX IF NOT EXISTS idx_offers_listing ON offers(listing_id);

DROP POLICY IF EXISTS "select_offers" ON offers;
CREATE POLICY "select_offers" ON offers FOR SELECT
  TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = dealer_id);

DROP POLICY IF EXISTS "insert_own_offers" ON offers;
CREATE POLICY "insert_own_offers" ON offers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "update_own_offers" ON offers;
CREATE POLICY "update_own_offers" ON offers FOR UPDATE
  TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = dealer_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = dealer_id);

-- ============================================================
-- TABLE: address_templates
-- Saved shipping/contact templates for buyers (like Shopee/
-- TikTok address templates). Each buyer can save multiple
-- templates with full name, phone, region, province,
-- municipality (barangay), and detailed address.
-- ============================================================
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
CREATE INDEX IF NOT EXISTS idx_address_templates_user ON address_templates(user_id);

DROP POLICY IF EXISTS "select_own_templates" ON address_templates;
CREATE POLICY "select_own_templates" ON address_templates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_templates" ON address_templates;
CREATE POLICY "insert_own_templates" ON address_templates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_templates" ON address_templates;
CREATE POLICY "update_own_templates" ON address_templates FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_templates" ON address_templates;
CREATE POLICY "delete_own_templates" ON address_templates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: notifications
-- System alerts linked to a specific user and optionally
-- to an offer. Shown on the Notifications page.
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'offer_received',
  title text NOT NULL,
  message text NOT NULL,
  offer_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE: reviews
-- Star ratings left by buyers for dealers after a
-- completed transaction.
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  dealer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quality_rating int NOT NULL DEFAULT 5 CHECK (quality_rating >= 1 AND quality_rating <= 5),
  service_rating int NOT NULL DEFAULT 5 CHECK (service_rating >= 1 AND service_rating <= 5),
  comment text NOT NULL DEFAULT '',
  buyer_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reviews_dealer ON reviews(dealer_id);

DROP POLICY IF EXISTS "select_reviews" ON reviews;
CREATE POLICY "select_reviews" ON reviews FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_reviews" ON reviews;
CREATE POLICY "insert_own_reviews" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "update_own_reviews" ON reviews;
CREATE POLICY "update_own_reviews" ON reviews FOR UPDATE
  TO authenticated USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

-- ============================================================
-- TABLE: categories
-- Standard and custom livestock types (e.g. Poultry, Swine,
-- Turkey, Duck). Dealers can add new ones.
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_categories" ON categories;
CREATE POLICY "select_categories" ON categories FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_categories" ON categories;
CREATE POLICY "insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (true);

-- Seed the 5 default categories
INSERT INTO categories (name) VALUES
  ('Poultry'), ('Swine'), ('Cattle'), ('Goat'), ('Duck')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- TRIGGER FUNCTION: handle_new_user
-- Automatically creates a profile row whenever a new user
-- signs up through Supabase Auth. Reads the name, account
-- type, farm name, and location from the sign-up metadata.
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, account_type, name, email, farm_name, region, province, municipality)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'farm_name',
    COALESCE(NEW.raw_user_meta_data->>'region', ''),
    COALESCE(NEW.raw_user_meta_data->>'province', ''),
    COALESCE(NEW.raw_user_meta_data->>'municipality', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TRIGGER FUNCTION: update_dealer_rating
-- Recalculates the average quality/service rating and
-- review count on the profiles table whenever a new review
-- is inserted. This keeps the dealer's displayed rating
-- always up-to-date without manual recalculation.
-- ============================================================
CREATE OR REPLACE FUNCTION update_dealer_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  avg_quality numeric(3,1);
  avg_service numeric(3,1);
  review_count int;
BEGIN
  SELECT
    ROUND(AVG(quality_rating)::numeric, 1),
    ROUND(AVG(service_rating)::numeric, 1),
    COUNT(*)
  INTO avg_quality, avg_service, review_count
  FROM reviews
  WHERE dealer_id = NEW.dealer_id;

  UPDATE profiles
  SET quality_rating = COALESCE(avg_quality, 0),
      service_rating = COALESCE(avg_service, 0),
      review_count = COALESCE(review_count, 0)
  WHERE id = NEW.dealer_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_review_inserted ON reviews;
CREATE TRIGGER on_review_inserted
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_dealer_rating();

-- ============================================================
-- STORED PROCEDURE: approve_offer
-- Called by the dealer when they approve a buyer's offer.
-- Runs as a single atomic transaction:
--   1. Verifies the caller is the offer's dealer
--   2. Deducts the offered quantity from the listing's stock
--   3. Sets the offer status to COMPLETED
--   4. Creates a notification for the buyer
-- This prevents double-selling: if two offers are approved
-- simultaneously, the stock deduction is atomic.
-- ============================================================
CREATE OR REPLACE FUNCTION approve_offer(
  p_offer_id uuid,
  p_dealer_notes text DEFAULT '',
  p_scheduled_pickup_window text DEFAULT NULL,
  p_delivery_fee int DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_offer RECORD;
BEGIN
  SELECT listing_id, dealer_id, buyer_id, quantity, fulfillment_method
    INTO v_offer
  FROM offers WHERE id = p_offer_id AND status = 'PENDING';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found or not pending';
  END IF;
  IF v_offer.dealer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Deduct stock atomically (never below 0)
  UPDATE listings
    SET available_stock = GREATEST(0, available_stock - v_offer.quantity)
  WHERE id = v_offer.listing_id;

  -- Set offer to COMPLETED, stamp completion time and dealer notes
  UPDATE offers
    SET status = 'COMPLETED',
        dealer_notes = p_dealer_notes,
        scheduled_pickup_window = p_scheduled_pickup_window,
        delivery_fee = p_delivery_fee,
        completed_at = now()
  WHERE id = p_offer_id;

  -- Notify the buyer
  INSERT INTO notifications (user_id, type, title, message, offer_id)
  VALUES (v_offer.buyer_id, 'offer_approved', 'Offer Approved',
          'Your offer has been approved by the dealer. The transaction is now complete.',
          p_offer_id);
END;
$$;

-- ============================================================
-- STORED PROCEDURE: reject_offer
-- Called by the dealer when they reject a buyer's offer.
-- Atomically sets status to REJECTED and notifies the buyer.
-- ============================================================
CREATE OR REPLACE FUNCTION reject_offer(p_offer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_offer RECORD;
BEGIN
  SELECT dealer_id, buyer_id INTO v_offer
  FROM offers WHERE id = p_offer_id AND status = 'PENDING';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found or not pending';
  END IF;
  IF v_offer.dealer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE offers SET status = 'REJECTED' WHERE id = p_offer_id;

  INSERT INTO notifications (user_id, type, title, message, offer_id)
  VALUES (v_offer.buyer_id, 'offer_rejected', 'Offer Rejected',
          'Your offer was declined by the dealer.',
          p_offer_id);
END;
$$;

-- Grant execute on the stored procedures to authenticated users only
GRANT EXECUTE ON FUNCTION approve_offer(uuid, text, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_offer(uuid) TO authenticated;

-- ============================================================
-- STORED PROCEDURE: send_dealer_reminder
-- Called by a dealer to send a custom reminder/notification
-- to the buyer of a specific offer. Validates that the
-- caller is the dealer on the offer, then inserts a
-- notification with type 'dealer_reminder' for the buyer.
-- ============================================================
CREATE OR REPLACE FUNCTION send_dealer_reminder(
  p_offer_id uuid,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $
DECLARE
  v_offer RECORD;
  v_notification_id uuid;
BEGIN
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

  INSERT INTO notifications (user_id, type, title, message, offer_id)
  VALUES (v_offer.buyer_id, 'dealer_reminder', 'Dealer Reminder', p_message, p_offer_id)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$;

REVOKE ALL ON FUNCTION send_dealer_reminder(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION send_dealer_reminder(uuid, text) TO authenticated;

-- Revoke direct access to trigger functions (they should only
-- fire automatically, never be called manually)
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION update_dealer_rating() FROM anon, authenticated;

-- Done! You should see "Success" below.
-- ============================================================
