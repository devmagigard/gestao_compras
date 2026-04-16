/*
  # Fix GRANT permissions for catalog tables

  ## Problem
  The product catalog tables have RLS policies configured correctly,
  but the Postgres role-level GRANT permissions were missing for both
  `anon` and `authenticated` roles. Without explicit GRANTs, Postgres
  rejects queries before even evaluating RLS policies, causing the
  "error" screen when navigating to the Catalog tab.

  ## Changes
  - Grant USAGE on schema public to anon and authenticated
  - Grant SELECT, INSERT, UPDATE, DELETE on product_catalog to anon and authenticated
  - Grant SELECT, INSERT, UPDATE, DELETE on product_suppliers to anon and authenticated
  - Grant SELECT, INSERT, UPDATE, DELETE on product_price_history to anon and authenticated

  ## Notes
  - This does not change any RLS policies, only the base privilege grants
  - RLS policies remain the actual access control layer
*/

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_catalog TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_suppliers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_price_history TO anon, authenticated;
