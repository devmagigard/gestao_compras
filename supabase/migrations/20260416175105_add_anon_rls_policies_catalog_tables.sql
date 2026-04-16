/*
  # Add anon role RLS policies for catalog tables

  ## Problem
  The app uses Supabase anon key (no auth session), so requests run as the `anon`
  role. The catalog tables only had policies for `authenticated` role, blocking all
  access and causing "Erro ao carregar catalogo".

  ## Fix
  Add anon role policies for SELECT, INSERT, UPDATE, DELETE on all 3 catalog tables,
  mirroring the pattern used by the existing tables (requisitions, purchase_order_items,
  quotations).
*/

-- product_catalog: anon policies
CREATE POLICY "Allow anonymous select on product catalog"
  ON product_catalog FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on product catalog"
  ON product_catalog FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on product catalog"
  ON product_catalog FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on product catalog"
  ON product_catalog FOR DELETE
  TO anon
  USING (true);

-- product_suppliers: anon policies
CREATE POLICY "Allow anonymous select on product suppliers"
  ON product_suppliers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on product suppliers"
  ON product_suppliers FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on product suppliers"
  ON product_suppliers FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on product suppliers"
  ON product_suppliers FOR DELETE
  TO anon
  USING (true);

-- product_price_history: anon policies
CREATE POLICY "Allow anonymous select on product price history"
  ON product_price_history FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on product price history"
  ON product_price_history FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on product price history"
  ON product_price_history FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on product price history"
  ON product_price_history FOR DELETE
  TO anon
  USING (true);
