/*
# Harden RPC permissions and categories INSERT policy

1. Revoke EXECUTE on approve_offer/reject_offer from anon role so only authenticated users can call them.
2. Tighten categories INSERT policy to require authentication (already authenticated-only, but make the WITH CHECK explicit).
3. Revoke EXECUTE on handle_new_user and update_dealer_rating from anon/authenticated — these are trigger functions, never called directly.
*/

REVOKE EXECUTE ON FUNCTION approve_offer(uuid, text, text, int) FROM anon;
REVOKE EXECUTE ON FUNCTION reject_offer(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION update_dealer_rating() FROM anon, authenticated;

DROP POLICY IF EXISTS "insert_categories" ON categories;
CREATE POLICY "insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (true);
