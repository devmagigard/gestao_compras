/*
  # Fix warranty end date calculation - apply to correct project

  This migration ensures the warranty calculation function and trigger
  exist in this project. It creates the warranty_end_date column,
  the calculation function, and the trigger that fires on all inserts/updates.
*/

-- Add warranty_end_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_order_items' AND column_name = 'warranty_end_date'
  ) THEN
    ALTER TABLE purchase_order_items ADD COLUMN warranty_end_date date;
  END IF;
END $$;

-- Function to calculate warranty end date
CREATE OR REPLACE FUNCTION calculate_warranty_end_date_db(
  p_start_date date,
  p_warranty_period text
)
RETURNS date
LANGUAGE plpgsql
AS $$
DECLARE
  v_clean_period text;
  v_period_number integer;
  v_end_date date;
BEGIN
  IF p_start_date IS NULL OR p_warranty_period IS NULL OR p_warranty_period = '' THEN
    RETURN NULL;
  END IF;

  v_clean_period := lower(trim(p_warranty_period));
  v_clean_period := translate(v_clean_period, 'áéíóúâêîôûãõàèìòùäëïöü', 'aeiouaeiouaoaeiouaeiou');

  v_period_number := (regexp_match(v_clean_period, '(\d+)'))[1]::integer;

  IF v_period_number IS NULL OR v_period_number <= 0 THEN
    RETURN NULL;
  END IF;

  IF v_clean_period ~* '(ano|year)' THEN
    v_end_date := p_start_date + (v_period_number || ' years')::interval;
  ELSIF v_clean_period ~* '(mes|month)' THEN
    v_end_date := p_start_date + (v_period_number || ' months')::interval;
  ELSIF v_clean_period ~* '(dia|day)' THEN
    v_end_date := p_start_date + (v_period_number || ' days')::interval;
  ELSIF v_clean_period ~* '(semana|week)' THEN
    v_end_date := p_start_date + (v_period_number || ' weeks')::interval;
  ELSE
    v_end_date := p_start_date + (v_period_number || ' months')::interval;
  END IF;

  RETURN v_end_date::date;
END;
$$;

-- Trigger function
CREATE OR REPLACE FUNCTION update_warranty_end_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_date date;
BEGIN
  v_start_date := COALESCE(NEW.data_entrega, NEW.data_po);
  NEW.warranty_end_date := calculate_warranty_end_date_db(v_start_date, NEW.garantia);
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger to fire on ALL INSERT OR UPDATE
DROP TRIGGER IF EXISTS trigger_update_warranty_end_date ON purchase_order_items;

CREATE TRIGGER trigger_update_warranty_end_date
  BEFORE INSERT OR UPDATE
  ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_warranty_end_date();

-- Recalculate all existing records
UPDATE purchase_order_items
SET warranty_end_date = calculate_warranty_end_date_db(
  COALESCE(data_entrega, data_po),
  garantia
)
WHERE garantia IS NOT NULL
  AND garantia != ''
  AND (data_entrega IS NOT NULL OR data_po IS NOT NULL);
