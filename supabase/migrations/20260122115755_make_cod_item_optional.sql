/*
  # Tornar campo cod_item opcional

  1. Alterações
    - Alterar coluna `cod_item` da tabela `purchase_order_items` para permitir valores NULL
    - Isso permite adicionar produtos sem código de item obrigatório

  2. Motivo
    - Flexibilizar o cadastro de produtos
    - Nem todos os produtos possuem código de item no momento do cadastro
*/

-- Alterar coluna cod_item para permitir NULL
ALTER TABLE purchase_order_items
  ALTER COLUMN cod_item DROP NOT NULL;
