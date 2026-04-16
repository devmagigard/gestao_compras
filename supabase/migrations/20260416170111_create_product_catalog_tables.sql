/*
  # Catalogo de Produtos - 3 novas tabelas

  ## Resumo
  Cria o catalogo centralizado de produtos com historico de precos e vinculos a fornecedores.

  ## Novas Tabelas

  ### 1. product_catalog
  - Repositorio central de produtos unicos
  - Campos: id, codigo, descricao, categoria, unidade_medida, ncm, observacoes, created_at, updated_at
  - Descricao e usada como chave de busca principal (busca parcial via ilike)

  ### 2. product_suppliers
  - Fornecedores vinculados a cada produto do catalogo
  - Campos: id, product_catalog_id (FK), nome_fornecedor, codigo_fornecedor, ativo, observacoes, created_at, updated_at
  - Permite rastrear quais fornecedores vendem cada produto

  ### 3. product_price_history
  - Historico cronologico de precos por produto e fornecedor
  - Campos: id, product_catalog_id (FK), product_supplier_id (FK opcional), valor, moeda,
            data_referencia, purchase_order_item_id (FK opcional para rastrear origem),
            requisition_id (FK opcional), fornecedor_nome, origem, observacoes, created_at
  - origem pode ser: 'PO' (purchase order), 'Cotacao', 'Manual'

  ## Seguranca
  - RLS habilitado em todas as 3 tabelas
  - Politicas separadas para SELECT, INSERT, UPDATE, DELETE
  - Acesso restrito a usuarios autenticados

  ## Indices
  - Indices em descricao e codigo para buscas rapidas
  - Indice em product_catalog_id nas tabelas filhas
*/

-- Tabela principal do catalogo
CREATE TABLE IF NOT EXISTS product_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text DEFAULT '',
  descricao text NOT NULL,
  categoria text DEFAULT '',
  unidade_medida text DEFAULT '',
  ncm text DEFAULT '',
  observacoes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indice para busca por descricao (ilike)
CREATE INDEX IF NOT EXISTS idx_product_catalog_descricao ON product_catalog USING gin(to_tsvector('portuguese', descricao));
CREATE INDEX IF NOT EXISTS idx_product_catalog_descricao_text ON product_catalog (descricao);
CREATE INDEX IF NOT EXISTS idx_product_catalog_codigo ON product_catalog (codigo);
CREATE INDEX IF NOT EXISTS idx_product_catalog_categoria ON product_catalog (categoria);

-- Fornecedores do produto
CREATE TABLE IF NOT EXISTS product_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_catalog_id uuid NOT NULL REFERENCES product_catalog(id) ON DELETE CASCADE,
  nome_fornecedor text NOT NULL,
  codigo_fornecedor text DEFAULT '',
  ativo boolean DEFAULT true,
  observacoes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_suppliers_catalog_id ON product_suppliers (product_catalog_id);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_nome ON product_suppliers (nome_fornecedor);

-- Historico de precos
CREATE TABLE IF NOT EXISTS product_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_catalog_id uuid NOT NULL REFERENCES product_catalog(id) ON DELETE CASCADE,
  product_supplier_id uuid REFERENCES product_suppliers(id) ON DELETE SET NULL,
  valor numeric(18,4) DEFAULT 0,
  moeda text DEFAULT 'BRL',
  data_referencia date NOT NULL DEFAULT CURRENT_DATE,
  purchase_order_item_id uuid REFERENCES purchase_order_items(id) ON DELETE SET NULL,
  requisition_id uuid REFERENCES requisitions(id) ON DELETE SET NULL,
  fornecedor_nome text DEFAULT '',
  numero_po text DEFAULT '',
  origem text DEFAULT 'Manual',
  observacoes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_catalog_id ON product_price_history (product_catalog_id);
CREATE INDEX IF NOT EXISTS idx_price_history_supplier_id ON product_price_history (product_supplier_id);
CREATE INDEX IF NOT EXISTS idx_price_history_data ON product_price_history (data_referencia DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_po_item ON product_price_history (purchase_order_item_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE product_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;

-- Politicas para product_catalog
CREATE POLICY "Authenticated users can view product catalog"
  ON product_catalog FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert product catalog"
  ON product_catalog FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update product catalog"
  ON product_catalog FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product catalog"
  ON product_catalog FOR DELETE
  TO authenticated
  USING (true);

-- Politicas para product_suppliers
CREATE POLICY "Authenticated users can view product suppliers"
  ON product_suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert product suppliers"
  ON product_suppliers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update product suppliers"
  ON product_suppliers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product suppliers"
  ON product_suppliers FOR DELETE
  TO authenticated
  USING (true);

-- Politicas para product_price_history
CREATE POLICY "Authenticated users can view price history"
  ON product_price_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert price history"
  ON product_price_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update price history"
  ON product_price_history FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete price history"
  ON product_price_history FOR DELETE
  TO authenticated
  USING (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_catalog_updated_at
  BEFORE UPDATE ON product_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_suppliers_updated_at
  BEFORE UPDATE ON product_suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
