/*
  # Fix quotations INSERT RLS policy

  ## Problem
  The existing INSERT policy for the quotations table was missing the WITH CHECK clause,
  which could block inserts depending on the Supabase RLS enforcement behavior.

  ## Changes
  - Drop the existing INSERT policy that has no WITH CHECK clause
  - Recreate it with WITH CHECK (true) to explicitly allow anonymous inserts
*/

DROP POLICY IF EXISTS "Allow anonymous insert on quotations" ON quotations;

CREATE POLICY "Allow anonymous insert on quotations"
  ON quotations
  FOR INSERT
  TO anon
  WITH CHECK (true);
