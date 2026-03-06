/*
  # Add Warranty End Date Automatic Calculation

  ## Overview
  This migration adds automatic calculation of warranty end dates for purchase order items.
  When a product has a warranty period and a start date (delivery date or PO date), the system
  automatically calculates and stores the warranty expiration date.

  ## Changes
  1. New Columns
    - `warranty_end_date` (date, nullable) - Stores the calculated warranty expiration date

  2. New Functions
    - `calculate_warranty_end_date_db()` - Calculates warranty end date based on start date and period
    - `update_warranty_end_date()` - Trigger function to automatically update warranty_end_date

  ## Warranty Calculation Logic
  - Uses data_entrega (delivery date) as start date, falls back to data_po if not available
  - Supports various formats: "12 meses", "1 ano", "24 months", "365 dias", etc.
  - If only a number is provided, assumes months
  - Updates automatically when garantia, data_entrega, or data_po changes

  ## Important Notes
  - The trigger runs BEFORE INSERT OR UPDATE on purchase_order_items table
  - If warranty period or start date is missing/invalid, warranty_end_date is set to NULL
  - Supports Portuguese and English period formats
*/

-- Add warranty_end_date column
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
  -- Return NULL if inputs are missing
  IF p_start_date IS NULL OR p_warranty_period IS NULL OR p_warranty_period = '' THEN
    RETURN NULL;
  END IF;

  -- Clean and normalize the warranty period
  v_clean_period := lower(trim(p_warranty_period));
  
  -- Remove accents using unaccent if available, otherwise basic normalization
  v_clean_period := translate(v_clean_period, 'áéíóúâêîôûãõàèìòùäëïöü', 'aeiouaeiouaoaeiouaeiou');

  -- Extract number from the period
  v_period_number := (regexp_match(v_clean_period, '(\d+)'))[1]::integer;
  
  IF v_period_number IS NULL OR v_period_number <= 0 THEN
    RETURN NULL;
  END IF;

  -- Determine time unit and calculate end date
  IF v_clean_period ~* '(ano|year)' THEN
    -- Years
    v_end_date := p_start_date + (v_period_number || ' years')::interval;
  ELSIF v_clean_period ~* '(mes|month)' THEN
    -- Months
    v_end_date := p_start_date + (v_period_number || ' months')::interval;
  ELSIF v_clean_period ~* '(dia|day)' THEN
    -- Days
    v_end_date := p_start_date + (v_period_number || ' days')::interval;
  ELSIF v_clean_period ~* '(semana|week)' THEN
    -- Weeks
    v_end_date := p_start_date + (v_period_number || ' weeks')::interval;
  ELSE
    -- Default: assume months if only number is provided
    v_end_date := p_start_date + (v_period_number || ' months')::interval;
  END IF;

  RETURN v_end_date::date;
END;
$$;

-- Trigger function to automatically update warranty end date
CREATE OR REPLACE FUNCTION update_warranty_end_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_date date;
BEGIN
  -- Determine start date: prefer data_entrega, fallback to data_po
  v_start_date := COALESCE(NEW.data_entrega, NEW.data_po);

  -- Calculate and set warranty end date
  NEW.warranty_end_date := calculate_warranty_end_date_db(v_start_date, NEW.garantia);

  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_warranty_end_date ON purchase_order_items;

-- Create trigger that runs before insert or update
CREATE TRIGGER trigger_update_warranty_end_date
  BEFORE INSERT OR UPDATE OF garantia, data_entrega, data_po
  ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_warranty_end_date();

-- Update existing records to calculate warranty end dates
UPDATE purchase_order_items
SET warranty_end_date = calculate_warranty_end_date_db(
  COALESCE(data_entrega, data_po),
  garantia
)
WHERE garantia IS NOT NULL AND garantia != '';

-- Add helpful comments
COMMENT ON COLUMN purchase_order_items.warranty_end_date IS 'Automatically calculated warranty expiration date based on delivery/PO date and warranty period';
COMMENT ON FUNCTION calculate_warranty_end_date_db IS 'Calculates warranty end date based on start date and warranty period (supports multiple formats)';
COMMENT ON FUNCTION update_warranty_end_date IS 'Trigger function that automatically calculates and updates warranty_end_date';
COMMENT ON TRIGGER trigger_update_warranty_end_date ON purchase_order_items IS 'Automatically calculates warranty end date when warranty period or dates change';
