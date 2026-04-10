/*
  # Fix warranty trigger to fire on all INSERT and UPDATE operations

  ## Problem
  The previous trigger only fired when garantia, data_entrega, or data_po columns changed.
  This meant warranty_end_date was not recalculated when other fields were updated.

  ## Fix
  - Drop and recreate the trigger without column-specific filtering
  - Trigger now fires on ANY INSERT OR UPDATE, always recalculating warranty_end_date
  - Recalculate all existing records that have warranty info but no end date
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_update_warranty_end_date ON purchase_order_items;

-- Recreate trigger to fire on ALL INSERT OR UPDATE (not just specific columns)
CREATE TRIGGER trigger_update_warranty_end_date
  BEFORE INSERT OR UPDATE
  ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_warranty_end_date();

-- Recalculate all records that have garantia and a start date but no warranty_end_date
UPDATE purchase_order_items
SET warranty_end_date = calculate_warranty_end_date_db(
  COALESCE(data_entrega, data_po),
  garantia
)
WHERE garantia IS NOT NULL 
  AND garantia != ''
  AND (data_entrega IS NOT NULL OR data_po IS NOT NULL);
