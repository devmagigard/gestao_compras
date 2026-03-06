/*
  # Add Automatic Status Update Based on Delivery Quantities

  ## Overview
  This migration adds a database trigger that automatically updates the status of purchase order items
  based on the relationship between quantidade (total quantity) and quantidade_entregue (delivered quantity).

  ## Changes
  1. New Functions
    - `calculate_purchase_order_status()` - Calculates appropriate status based on delivery progress
    - `update_purchase_order_status()` - Trigger function that runs before insert/update operations

  ## Status Logic
  - When quantidade_entregue = quantidade (100% delivered): Status = 'Entregue'
  - When quantidade_entregue > 0 AND < quantidade (partial): Status = 'Parcialmente Entregue'
  - When quantidade_entregue = 0: Keeps current status (Pedido, Em Trânsito, etc.)
  - Preserves manual override for 'Cancelado' status

  ## Important Notes
  - The trigger runs BEFORE INSERT OR UPDATE on purchase_order_items table
  - Only updates status automatically if not manually set to 'Cancelado'
  - Handles edge cases like null values and division by zero
*/

-- Function to calculate the appropriate status based on delivery quantities
CREATE OR REPLACE FUNCTION calculate_purchase_order_status(
  p_quantidade numeric,
  p_quantidade_entregue numeric,
  p_current_status text
)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Preserve 'Cancelado' status - don't auto-update if manually cancelled
  IF p_current_status = 'Cancelado' THEN
    RETURN p_current_status;
  END IF;

  -- Handle null or zero total quantity
  IF p_quantidade IS NULL OR p_quantidade <= 0 THEN
    RETURN COALESCE(p_current_status, 'Pedido');
  END IF;

  -- Handle null delivered quantity (treat as 0)
  IF p_quantidade_entregue IS NULL THEN
    RETURN COALESCE(p_current_status, 'Pedido');
  END IF;

  -- Fully delivered
  IF p_quantidade_entregue >= p_quantidade THEN
    RETURN 'Entregue';
  END IF;

  -- Partially delivered
  IF p_quantidade_entregue > 0 AND p_quantidade_entregue < p_quantidade THEN
    RETURN 'Parcialmente Entregue';
  END IF;

  -- No delivery yet - preserve current status
  RETURN COALESCE(p_current_status, 'Pedido');
END;
$$;

-- Trigger function to automatically update status
CREATE OR REPLACE FUNCTION update_purchase_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculate and set the appropriate status
  NEW.status := calculate_purchase_order_status(
    NEW.quantidade,
    NEW.quantidade_entregue,
    NEW.status
  );

  -- Update the updated_at timestamp
  NEW.updated_at := now();

  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_purchase_order_status ON purchase_order_items;

-- Create trigger that runs before insert or update
CREATE TRIGGER trigger_update_purchase_order_status
  BEFORE INSERT OR UPDATE OF quantidade, quantidade_entregue, status
  ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_order_status();

-- Add helpful comment
COMMENT ON FUNCTION calculate_purchase_order_status IS 'Calculates purchase order item status based on delivery progress';
COMMENT ON FUNCTION update_purchase_order_status IS 'Trigger function that automatically updates purchase order item status based on delivered quantities';
COMMENT ON TRIGGER trigger_update_purchase_order_status ON purchase_order_items IS 'Automatically updates status when quantities change';
