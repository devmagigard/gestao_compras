/*
  # Criar tabela purchase_order_items

  1. Nova Tabela
    - `purchase_order_items`
      - `id` (uuid, primary key)
      - `numero_po` (text, obrigatório)
      - `ultima_atualizacao` (date, padrão hoje)
      - `data_po` (date, opcional)
      - `cod_item` (text, opcional)
      - `descricao_item` (text, obrigatório)
      - `ncm` (text, opcional)
      - `garantia` (text, opcional)
      - `quantidade` (numeric, padrão 0)
      - `quantidade_entregue` (numeric, padrão 0)
      - `valor_unitario` (numeric, padrão 0)
      - `moeda` (text, padrão 'BRL')
      - `condicoes_pagamento` (text, opcional)
      - `data_entrega` (date, opcional)
      - `status` (text, padrão 'Pedido')
      - `observacoes` (text, opcional)
      - `requisition_id` (uuid, opcional - vincula com requisições)
      - `created_at` (timestamp, padrão now())
      - `updated_at` (timestamp, padrão now())

  2. Índices
    - Índices para otimização de consultas em campos frequentemente pesquisados

  3. Função e Trigger
    - Função para atualizar automaticamente o campo `updated_at`
    - Trigger que executa a função antes de cada UPDATE

  4. Segurança
    - Habilitar RLS na tabela `purchase_order_items`
    - Políticas para permitir todas as operações (SELECT, INSERT, UPDATE, DELETE) para usuários anônimos e autenticados
*/

-- Habilitar a extensão uuid-ossp se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Criar a tabela purchase_order_items
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_po text NOT NULL,
    ultima_atualizacao date DEFAULT CURRENT_DATE,
    data_po date,
    cod_item text,
    descricao_item text NOT NULL,
    ncm text,
    garantia text,
    quantidade numeric DEFAULT '0'::numeric,
    quantidade_entregue numeric DEFAULT '0'::numeric,
    valor_unitario numeric DEFAULT '0'::numeric,
    moeda text DEFAULT 'BRL'::text,
    condicoes_pagamento text,
    data_entrega date,
    status text DEFAULT 'Pedido'::text,
    observacoes text,
    requisition_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id)
);

-- 2. Habilitar Row Level Security (RLS) para a tabela
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- 3. Criar índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_cod_item ON public.purchase_order_items USING btree (cod_item);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_data_entrega ON public.purchase_order_items USING btree (data_entrega);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_numero_po ON public.purchase_order_items USING btree (numero_po);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_requisition_id ON public.purchase_order_items USING btree (requisition_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_status ON public.purchase_order_items USING btree (status);

-- 4. Criar função para atualizar a coluna 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION public.update_purchase_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para a função 'update_purchase_order_items_updated_at'
DROP TRIGGER IF EXISTS update_purchase_order_items_updated_at_trigger ON public.purchase_order_items;
CREATE TRIGGER update_purchase_order_items_updated_at_trigger
BEFORE UPDATE ON public.purchase_order_items
FOR EACH ROW EXECUTE FUNCTION public.update_purchase_order_items_updated_at();

-- 6. Criar políticas de Row Level Security (RLS) para acesso anônimo e autenticado

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Allow anonymous delete on purchase order items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Allow anonymous insert on purchase order items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Allow anonymous select on purchase order items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Allow anonymous update on purchase order items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Allow authenticated delete on purchase order items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Allow authenticated insert on purchase order items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Allow authenticated select on purchase order items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Allow authenticated update on purchase order items" ON public.purchase_order_items;

-- Criar políticas para usuários anônimos
CREATE POLICY "Allow anonymous delete on purchase order items" ON public.purchase_order_items FOR DELETE TO anon USING (true);
CREATE POLICY "Allow anonymous insert on purchase order items" ON public.purchase_order_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous select on purchase order items" ON public.purchase_order_items FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous update on purchase order items" ON public.purchase_order_items FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Criar políticas para usuários autenticados
CREATE POLICY "Allow authenticated delete on purchase order items" ON public.purchase_order_items FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on purchase order items" ON public.purchase_order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select on purchase order items" ON public.purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated update on purchase order items" ON public.purchase_order_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);