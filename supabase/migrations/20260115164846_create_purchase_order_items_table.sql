/*
  # Criar tabela de itens de pedido de compra (Purchase Order Items)

  1. Nova Tabela
    - `purchase_order_items`
      - `id` (uuid, primary key) - Identificador único do item
      - `numero_po` (text) - Número do pedido de compra
      - `ultima_atualizacao` (date) - Data da última atualização
      - `data_po` (date) - Data do pedido de compra
      - `cod_item` (text) - Código do item
      - `descricao_item` (text) - Descrição detalhada do item
      - `ncm` (text) - Nomenclatura Comum do Mercosul
      - `garantia` (text) - Informações sobre garantia
      - `quantidade` (numeric) - Quantidade total solicitada
      - `quantidade_entregue` (numeric) - Quantidade já entregue
      - `valor_unitario` (numeric) - Valor unitário do item
      - `moeda` (text) - Moeda do valor (BRL, USD, EUR, etc)
      - `condicoes_pagamento` (text) - Condições de pagamento
      - `data_entrega` (date) - Data prevista de entrega
      - `status` (text) - Status do item no pedido
      - `observacoes` (text) - Observações adicionais
      - `requisition_id` (uuid) - ID da requisição vinculada (opcional)
      - `created_at` (timestamptz) - Data de criação
      - `updated_at` (timestamptz) - Data de atualização

  2. Security
    - Enable RLS on `purchase_order_items` table
    - Add policies for authenticated users to perform CRUD operations
*/

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_po text NOT NULL,
  ultima_atualizacao date DEFAULT CURRENT_DATE,
  data_po date,
  cod_item text NOT NULL,
  descricao_item text NOT NULL,
  ncm text,
  garantia text,
  quantidade numeric DEFAULT 0,
  quantidade_entregue numeric DEFAULT 0,
  valor_unitario numeric DEFAULT 0,
  moeda text DEFAULT 'BRL',
  condicoes_pagamento text,
  data_entrega date,
  status text DEFAULT 'Pedido',
  observacoes text,
  requisition_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all purchase order items
CREATE POLICY "Users can view all purchase order items"
  ON purchase_order_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can insert purchase order items
CREATE POLICY "Users can insert purchase order items"
  ON purchase_order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can update purchase order items
CREATE POLICY "Users can update purchase order items"
  ON purchase_order_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Users can delete purchase order items
CREATE POLICY "Users can delete purchase order items"
  ON purchase_order_items
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index on numero_po for faster queries
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_numero_po ON purchase_order_items(numero_po);

-- Create index on cod_item for faster queries
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_cod_item ON purchase_order_items(cod_item);

-- Create index on data_entrega for faster queries
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_data_entrega ON purchase_order_items(data_entrega);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_status ON purchase_order_items(status);

-- Create index on requisition_id for faster joins
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_requisition_id ON purchase_order_items(requisition_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_purchase_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_purchase_order_items_updated_at_trigger
  BEFORE UPDATE ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_order_items_updated_at();