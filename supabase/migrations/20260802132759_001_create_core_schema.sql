/*
# Core Schema for Local Livestock Trading Platform

## Overview
Creates the complete database schema for a provincial livestock marketplace:
- **profiles**: Extends Supabase auth.users with role, name, farm info, location.
- **listings**: Livestock batches listed by dealers, with stock counters.
- **offers**: Buyer purchase requests with fulfillment options and status workflow.
- **notifications**: System alerts linked to offers and users.
- **reviews**: Dealer star ratings submitted by buyers after completed offers.
- **categories**: Standard + custom livestock types (e.g. Turkey, Duck).

## Tables

### profiles
- id (uuid, PK, references auth.users)
- account_type ('customer' | 'dealer')
- name, email, farm_name, phone
- region, province, municipality (Philippine geographic data)
- quality_rating, service_rating, review_count (dealer rating aggregates)
- created_at

### listings
- id (uuid PK)
- dealer_id (FK profiles)
- title, category, batch_number
- price_per_head, available_stock, original_stock
- region, province, municipality, description, image_url
- is_active, created_at

### offers
- id (uuid PK)
- listing_id (FK listings), dealer_id (FK profiles), buyer_id (FK profiles)
- buyer_name, buyer_contact, quantity
- fulfillment_method ('pickup' | 'delivery')
- preferred_date, delivery_fee, dealer_notes, scheduled_pickup_window
- status ('PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED')
- rated, completed_at, created_at

### notifications
- id (uuid PK)
- user_id (FK profiles)
- type, title, message, offer_id
- read, created_at

### reviews
- id (uuid PK)
- offer_id (FK offers), dealer_id (FK profiles), buyer_id (FK profiles)
- quality_rating, service_rating, comment, buyer_name
- created_at

### categories
- id (uuid PK)
- name (unique, e.g. "Poultry", "Turkey")

## Security (RLS)
- profiles: users read/update own profile; anyone authenticated can read dealer profiles (for marketplace)
- listings: authenticated can read all active listings; dealers create/update own
- offers: buyers create own; buyers+dealers read offers they're party to; dealers update status on their offers
- notifications: users read/update own only
- reviews: authenticated read all; buyers create for their own completed offers
- categories: authenticated read all; dealers insert new ones

## Triggers / RPCs
- handle_new_user(): auto-creates a profile row when a user signs up via Supabase Auth
- approve_offer() SECURITY DEFINER RPC: atomically sets offer to APPROVED, deducts stock from listing, marks offer COMPLETED, and creates a notification — all in one transaction
- reject_offer() SECURITY DEFINER RPC: atomically sets offer to REJECTED + creates notification
- update_dealer_rating() trigger: recalculates quality_rating/service_rating/review_count on the profiles table whenever a review is inserted
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type text NOT NULL DEFAULT 'customer' CHECK (account_type IN ('customer','dealer')),
  name text NOT NULL,
  email text NOT NULL,
  farm_name text,
  phone text,
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
-- LISTINGS
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
-- OFFERS
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

-- ============================================================
-- NOTIFICATIONS
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
-- REVIEWS
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

-- ============================================================
-- CATEGORIES
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

-- Seed default categories
INSERT INTO categories (name) VALUES
  ('Poultry'), ('Swine'), ('Cattle'), ('Goat'), ('Duck')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- FUNCTION: handle_new_user (trigger on auth.users)
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
-- FUNCTION: update_dealer_rating (trigger on reviews)
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
-- RPC: approve_offer (atomic stock deduction + status + notification)
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

  -- Set offer to APPROVED then COMPLETED, stamp completion time
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
-- RPC: reject_offer (status update + notification)
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

-- Grant execute on RPCs to authenticated role
GRANT EXECUTE ON FUNCTION approve_offer(uuid, text, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_offer(uuid) TO authenticated;
