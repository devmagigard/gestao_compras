/*
  # Create requisitions table

  1. New Tables
    - `requisitions`
      - `id` (uuid, primary key)
      - `rc` (text, required) - Código da requisição
      - `project` (text, required) - Nome do projeto
      - `category` (text, optional) - Categoria do item
      - `item` (text, required) - Descrição do item
      - `freight` (boolean, default false) - Se possui frete
      - `supplier` (text, optional) - Fornecedor
      - `observations` (text, optional) - Observações
      - `po_sent` (date, optional) - Data do PO enviado
      - `status` (text, default 'Em cotação') - Status da requisição
      - `update_date` (date, required) - Data de atualização
      - `adt_invoice` (text, optional) - ADT/Fatura
      - `quotation_deadline` (date, optional) - Prazo de cotação
      - `omie_inclusion` (date, optional) - Data inclusão OMIE
      - `delivery_forecast` (date, optional) - Previsão de entrega
      - `quotation_inclusion` (date, optional) - Data inclusão para cotação
      - `sent_for_approval` (date, optional) - Data envio para aprovação
      - `omie_approval` (date, optional) - Data aprovação OMIE
      - `criticality` (text, default 'Média') - Criticidade
      - `dismembered_rc` (text, optional) - RC desmembrado
      - `invoice_value` (numeric, default 0) - Valor da nota fiscal
      - `invoice_number` (text, optional) - Número da nota fiscal
      - `payment_method` (text, optional) - Forma de pagamento
      - `due_date_1` (date, optional) - Vencimento parcela 1
      - `due_date_2` (date, optional) - Vencimento parcela 2
      - `due_date_3` (date, optional) - Vencimento parcela 3
      - `quoted_by` (text, optional) - Cotado por
      - `freight_value` (numeric, default 0) - Valor do frete
      - `freight_status` (text, optional) - Status do frete
      - `quoted_supplier` (text, optional) - Fornecedor cotado
      - `quotation_type` (text, default 'Simples') - Tipo de cotação
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `requisitions` table
    - Add policy for public access (since no authentication is implemented)
*/

CREATE TABLE IF NOT EXISTS requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rc text NOT NULL,
  project text NOT NULL,
  category text,
  item text NOT NULL,
  freight boolean DEFAULT false,
  supplier text,
  observations text,
  po_sent date,
  status text DEFAULT 'Em cotação',
  update_date date NOT NULL DEFAULT CURRENT_DATE,
  adt_invoice text,
  quotation_deadline date,
  omie_inclusion date,
  delivery_forecast date,
  quotation_inclusion date,
  sent_for_approval date,
  omie_approval date,
  criticality text DEFAULT 'Média',
  dismembered_rc text,
  invoice_value numeric DEFAULT 0,
  invoice_number text,
  payment_method text,
  due_date_1 date,
  due_date_2 date,
  due_date_3 date,
  quoted_by text,
  freight_value numeric DEFAULT 0,
  freight_status text,
  quoted_supplier text,
  quotation_type text DEFAULT 'Simples',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE requisitions ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (no authentication required)
CREATE POLICY "Allow all operations for everyone"
  ON requisitions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_requisitions_rc ON requisitions(rc);
CREATE INDEX IF NOT EXISTS idx_requisitions_project ON requisitions(project);
CREATE INDEX IF NOT EXISTS idx_requisitions_status ON requisitions(status);
CREATE INDEX IF NOT EXISTS idx_requisitions_created_at ON requisitions(created_at);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_requisitions_updated_at
  BEFORE UPDATE ON requisitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();