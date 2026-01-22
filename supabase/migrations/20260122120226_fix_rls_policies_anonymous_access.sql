/*
  # Corrigir políticas RLS para permitir acesso anônimo

  1. Alterações
    - Remover políticas antigas que exigem autenticação
    - Criar novas políticas que permitem acesso anônimo
    - Permitir SELECT, INSERT, UPDATE e DELETE para usuários anônimos

  2. Motivo
    - O sistema não usa autenticação de usuários
    - As políticas anteriores bloqueavam operações de usuários anônimos
    - Sistema interno não requer autenticação
*/

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view all purchase order items" ON purchase_order_items;
DROP POLICY IF EXISTS "Users can insert purchase order items" ON purchase_order_items;
DROP POLICY IF EXISTS "Users can update purchase order items" ON purchase_order_items;
DROP POLICY IF EXISTS "Users can delete purchase order items" ON purchase_order_items;

-- Criar novas políticas para acesso anônimo
CREATE POLICY "Allow anonymous select on purchase order items"
  ON purchase_order_items
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on purchase order items"
  ON purchase_order_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on purchase order items"
  ON purchase_order_items
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on purchase order items"
  ON purchase_order_items
  FOR DELETE
  TO anon
  USING (true);

-- Também permitir para usuários autenticados (caso seja necessário no futuro)
CREATE POLICY "Allow authenticated select on purchase order items"
  ON purchase_order_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on purchase order items"
  ON purchase_order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on purchase order items"
  ON purchase_order_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on purchase order items"
  ON purchase_order_items
  FOR DELETE
  TO authenticated
  USING (true);
