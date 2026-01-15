import { supabase } from '../lib/supabase';
import { Requisition } from '../types';

interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{ line: number; rc: string; error: string }>;
}

export interface ImportResult {
  success: boolean;
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: Array<{ line: number; rc: string; error: string }>;
  message: string;
}

function transformRequisitionToSupabaseFormat(req: Requisition) {
  return {
    rc: req.rc || '',
    project: req.project || '',
    category: req.category || null,
    item: req.item || '',
    freight: req.freight || false,
    supplier: req.supplier || null,
    observations: req.observations || null,
    po_sent: req.poSent || null,
    status: req.status || 'Em cotação',
    update_date: req.updateDate || new Date().toISOString().split('T')[0],
    adt_invoice: req.adtInvoice || null,
    quotation_deadline: req.quotationDeadline || null,
    omie_inclusion: req.omieInclusion || null,
    delivery_forecast: req.deliveryForecast || null,
    quotation_inclusion: req.quotationInclusion || null,
    sent_for_approval: req.sentForApproval || null,
    omie_approval: req.omieApproval || null,
    criticality: req.criticality || 'Média',
    dismembered_rc: req.dismemberedRc || null,
    invoice_value: req.invoiceValue || 0,
    invoice_number: req.invoiceNumber || null,
    payment_method: req.paymentMethod || null,
    due_date_1: req.dueDate1 || null,
    due_date_2: req.dueDate2 || null,
    due_date_3: req.dueDate3 || null,
    quoted_by: req.quotedBy || null,
    freight_value: req.freightValue || 0,
    freight_status: req.freightStatus || null,
    freight_company: req.freightCompany || null,
    quoted_supplier: req.quotedSupplier || null,
    quotation_type: req.quotationType || 'Simples'
  };
}

export async function importRequisitionsToSupabase(
  requisitions: Requisition[],
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const progress: ImportProgress = {
    total: requisitions.length,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: []
  };

  const BATCH_SIZE = 50;
  const batches: Requisition[][] = [];

  for (let i = 0; i < requisitions.length; i += BATCH_SIZE) {
    batches.push(requisitions.slice(i, i + BATCH_SIZE));
  }

  console.log(`Iniciando importação de ${requisitions.length} requisições em ${batches.length} lotes`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`Processando lote ${batchIndex + 1}/${batches.length} (${batch.length} itens)`);

    const transformedBatch = batch.map((req, index) => {
      try {
        return transformRequisitionToSupabaseFormat(req);
      } catch (error) {
        const lineNumber = batchIndex * BATCH_SIZE + index + 2;
        progress.errors.push({
          line: lineNumber,
          rc: req.rc || 'N/A',
          error: `Erro na transformação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
        progress.failed++;
        return null;
      }
    }).filter(item => item !== null);

    if (transformedBatch.length === 0) {
      progress.processed += batch.length;
      continue;
    }

    try {
      const { data, error } = await supabase
        .from('requisitions')
        .insert(transformedBatch)
        .select();

      if (error) {
        console.error(`Erro ao inserir lote ${batchIndex + 1}:`, error);

        for (let i = 0; i < batch.length; i++) {
          const lineNumber = batchIndex * BATCH_SIZE + i + 2;
          progress.errors.push({
            line: lineNumber,
            rc: batch[i].rc || 'N/A',
            error: `Erro no lote: ${error.message}`
          });
          progress.failed++;
        }
      } else {
        progress.successful += data?.length || transformedBatch.length;
        console.log(`Lote ${batchIndex + 1} inserido com sucesso: ${data?.length || transformedBatch.length} registros`);
      }

      progress.processed += batch.length;

      if (onProgress) {
        onProgress({ ...progress });
      }

      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Erro inesperado ao processar lote ${batchIndex + 1}:`, error);

      for (let i = 0; i < batch.length; i++) {
        const lineNumber = batchIndex * BATCH_SIZE + i + 2;
        progress.errors.push({
          line: lineNumber,
          rc: batch[i].rc || 'N/A',
          error: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
        progress.failed++;
      }

      progress.processed += batch.length;

      if (onProgress) {
        onProgress({ ...progress });
      }
    }
  }

  const result: ImportResult = {
    success: progress.successful > 0,
    totalProcessed: progress.processed,
    successful: progress.successful,
    failed: progress.failed,
    errors: progress.errors,
    message: `Importação concluída: ${progress.successful} registros inseridos com sucesso, ${progress.failed} falharam`
  };

  console.log('Resultado final da importação:', result);
  return result;
}

export async function checkExistingRequisitions(rcs: string[]): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('requisitions')
      .select('rc')
      .in('rc', rcs);

    if (error) {
      console.error('Erro ao verificar requisições existentes:', error);
      return [];
    }

    return data?.map(item => item.rc) || [];
  } catch (error) {
    console.error('Erro inesperado ao verificar requisições:', error);
    return [];
  }
}
