import { supabase } from '../lib/supabase';
import { PurchaseOrderItem } from '../types';

export interface ImportError {
  line: number;
  item: string;
  error: string;
}

export interface ImportResult {
  success: boolean;
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: ImportError[];
  message: string;
}

export interface ProgressCallback {
  (progress: { processed: number; total: number; successful: number; failed: number }): void;
}

export async function importProductsToSupabase(
  products: Omit<PurchaseOrderItem, 'id' | 'createdAt' | 'updatedAt'>[],
  onProgress?: ProgressCallback
): Promise<ImportResult> {
  const errors: ImportError[] = [];
  let successful = 0;
  let failed = 0;

  console.log(`Iniciando importação de ${products.length} produtos no Supabase...`);

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const lineNumber = i + 2;

    try {
      console.log(`Importando produto ${i + 1}/${products.length}: ${product.numeroPo} - ${product.codItem}`);

      const { error } = await supabase
        .from('purchase_order_items')
        .insert({
          numero_po: product.numeroPo,
          ultima_atualizacao: product.ultimaAtualizacao || new Date().toISOString().split('T')[0],
          data_po: product.dataPo,
          cod_item: product.codItem,
          descricao_item: product.descricaoItem,
          ncm: product.ncm,
          garantia: product.garantia,
          quantidade: product.quantidade,
          quantidade_entregue: product.quantidadeEntregue,
          valor_unitario: product.valorUnitario,
          moeda: product.moeda,
          condicoes_pagamento: product.condicoesPagamento,
          data_entrega: product.dataEntrega,
          status: product.status,
          observacoes: product.observacoes,
          requisition_id: product.requisitionId || null
        });

      if (error) {
        console.error(`Erro ao inserir produto ${product.codItem}:`, error);
        errors.push({
          line: lineNumber,
          item: `${product.numeroPo} - ${product.codItem}`,
          error: error.message
        });
        failed++;
      } else {
        console.log(`Produto ${product.codItem} importado com sucesso`);
        successful++;
      }

    } catch (error) {
      console.error(`Erro ao processar produto ${product.codItem}:`, error);
      errors.push({
        line: lineNumber,
        item: `${product.numeroPo} - ${product.codItem}`,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      failed++;
    }

    if (onProgress) {
      onProgress({
        processed: i + 1,
        total: products.length,
        successful,
        failed
      });
    }
  }

  const result: ImportResult = {
    success: successful > 0 && failed === 0,
    totalProcessed: products.length,
    successful,
    failed,
    errors,
    message: failed === 0
      ? `${successful} produto(s) importado(s) com sucesso!`
      : `${successful} produto(s) importado(s), ${failed} falharam. Veja os erros abaixo.`
  };

  console.log('Resultado da importação:', result);
  return result;
}
