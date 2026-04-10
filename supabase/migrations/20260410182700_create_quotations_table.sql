/*
  # Create quotations table

  ## Summary
  Creates a table to store supplier quotations linked to each requisition.
  Each requisition can have multiple supplier quotations, and one can be marked as the winner (champion).

  ## New Tables
  - `quotations`
    - `id` (uuid, primary key)
    - `requisition_id` (uuid, FK to requisitions) - links the quotation to a requisition
    - `supplier_name` (text) - name of the supplier
    - `value` (numeric) - quoted value
    - `delivery_days` (integer) - estimated delivery in days
    - `payment_conditions` (text) - payment conditions offered
    - `notes` (text) - additional notes
    - `is_winner` (boolean) - marks this quotation as the winner/champion
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on `quotations` table
  - Policies for anonymous access (matching existing requisitions table pattern)

  ## Notes
  1. A requisition can have multiple quotations (typically up to 3 suppliers)
  2. Only one quotation per requisition should be marked as winner
  3. A trigger ensures updated_at is auto-updated on row changes
*/

CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id uuid NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
  supplier_name text NOT NULL DEFAULT '',
  value numeric DEFAULT 0,
  delivery_days integer DEFAULT 0,
  payment_conditions text DEFAULT '',
  notes text DEFAULT '',
  is_winner boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous select on quotations"
  ON quotations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on quotations"
  ON quotations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on quotations"
  ON quotations FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on quotations"
  ON quotations FOR DELETE
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_quotations_requisition_id ON quotations(requisition_id);

CREATE OR REPLACE FUNCTION update_quotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotations_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_quotations_updated_at();
