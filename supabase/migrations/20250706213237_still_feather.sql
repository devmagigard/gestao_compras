/*
  # Adicionar colunas de frete

  1. Modificações na tabela
    - Adicionar coluna `freight_company` (text, optional) - Transportadora
    - As colunas `freight_value` e `freight_status` já existem

  2. Observações
    - Mantém compatibilidade com dados existentes
    - Todas as novas colunas são opcionais
*/

DO $$
BEGIN
  -- Adicionar coluna transportadora se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'requisitions' AND column_name = 'freight_company'
  ) THEN
    ALTER TABLE requisitions ADD COLUMN freight_company text;
  END IF;
END $$;