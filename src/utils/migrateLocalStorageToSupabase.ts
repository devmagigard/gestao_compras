import { supabase } from '../lib/supabase';
import { Requisition, PurchaseOrderItem } from '../types';

/**
 * Migra dados do localStorage para o Supabase
 * Esta função deve ser executada apenas uma vez para migrar dados existentes
 */
export async function migrateLocalStorageToSupabase() {
  try {
    console.log('🔄 Iniciando migração de dados do localStorage para Supabase...');

    // 1. Obter dados de requisições do localStorage
    const requisitionsData = localStorage.getItem('requisitions');
    const requisitions: Requisition[] = requisitionsData ? JSON.parse(requisitionsData) : [];

    console.log(`📦 Encontradas ${requisitions.length} requisições no localStorage`);

    // 2. Obter dados de purchase orders do localStorage (se existir)
    const purchaseOrdersData = localStorage.getItem('purchaseOrderItems');
    const purchaseOrders: PurchaseOrderItem[] = purchaseOrdersData ? JSON.parse(purchaseOrdersData) : [];

    console.log(`📦 Encontrados ${purchaseOrders.length} itens de pedido no localStorage`);

    let migratedRequisitions = 0;
    let migratedPurchaseOrders = 0;

    // 3. Migrar requisições
    if (requisitions.length > 0) {
      console.log('🚀 Migrando requisições...');

      const requisitionsToMigrate = requisitions.map(req => {
        // Remover campos que serão gerados pelo Supabase
        const { id, createdAt, updatedAt, ...reqData } = req;

        // Converter formato camelCase para snake_case do Supabase
        return {
          rc: reqData.rc,
          project: reqData.project,
          category: reqData.category || null,
          item: reqData.item,
          freight: reqData.freight,
          supplier: reqData.supplier || null,
          observations: reqData.observations || null,
          po_sent: reqData.poSent || null,
          status: reqData.status,
          update_date: reqData.updateDate || new Date().toISOString().split('T')[0],
          adt_invoice: reqData.adtInvoice || null,
          quotation_deadline: reqData.quotationDeadline || null,
          omie_inclusion: reqData.omieInclusion || null,
          delivery_forecast: reqData.deliveryForecast || null,
          quotation_inclusion: reqData.quotationInclusion || null,
          sent_for_approval: reqData.sentForApproval || null,
          omie_approval: reqData.omieApproval || null,
          criticality: reqData.criticality,
          dismembered_rc: reqData.dismemberedRc || null,
          invoice_value: reqData.invoiceValue || 0,
          invoice_number: reqData.invoiceNumber || null,
          payment_method: reqData.paymentMethod || null,
          due_date_1: reqData.dueDate1 || null,
          due_date_2: reqData.dueDate2 || null,
          due_date_3: reqData.dueDate3 || null,
          quoted_by: reqData.quotedBy || null,
          freight_value: reqData.freightValue || 0,
          freight_status: reqData.freightStatus || null,
          freight_company: reqData.freightCompany || null,
          quoted_supplier: reqData.quotedSupplier || null,
          quotation_type: reqData.quotationType
        };
      });

      const { data, error } = await supabase
        .from('requisitions')
        .insert(requisitionsToMigrate)
        .select();

      if (error) {
        console.error('❌ Erro ao migrar requisições:', error);
        throw error;
      }

      migratedRequisitions = data?.length || 0;
      console.log(`✅ ${migratedRequisitions} requisições migradas com sucesso!`);
    }

    // 4. Migrar purchase orders
    if (purchaseOrders.length > 0) {
      console.log('🚀 Migrando itens de pedido...');

      const purchaseOrdersToMigrate = purchaseOrders.map(item => {
        const { id, createdAt, updatedAt, ...itemData } = item;

        return {
          numero_po: itemData.numeroPo,
          ultima_atualizacao: itemData.ultimaAtualizacao || new Date().toISOString().split('T')[0],
          data_po: itemData.dataPo || null,
          cod_item: itemData.codItem,
          descricao_item: itemData.descricaoItem,
          ncm: itemData.ncm || null,
          garantia: itemData.garantia || null,
          quantidade: itemData.quantidade || 0,
          quantidade_entregue: itemData.quantidadeEntregue || 0,
          valor_unitario: itemData.valorUnitario || 0,
          moeda: itemData.moeda || 'BRL',
          condicoes_pagamento: itemData.condicoesPagamento || null,
          data_entrega: itemData.dataEntrega || null,
          status: itemData.status,
          observacoes: itemData.observacoes || null,
          requisition_id: itemData.requisitionId || null
        };
      });

      const { data, error } = await supabase
        .from('purchase_order_items')
        .insert(purchaseOrdersToMigrate)
        .select();

      if (error) {
        console.error('❌ Erro ao migrar itens de pedido:', error);
        throw error;
      }

      migratedPurchaseOrders = data?.length || 0;
      console.log(`✅ ${migratedPurchaseOrders} itens de pedido migrados com sucesso!`);
    }

    // 5. Fazer backup do localStorage antes de limpar
    const backup = {
      requisitions,
      purchaseOrders,
      migratedAt: new Date().toISOString()
    };
    localStorage.setItem('backup_before_migration', JSON.stringify(backup));
    console.log('💾 Backup criado no localStorage: backup_before_migration');

    return {
      success: true,
      migratedRequisitions,
      migratedPurchaseOrders,
      message: `Migração concluída com sucesso! ${migratedRequisitions} requisições e ${migratedPurchaseOrders} itens de pedido foram migrados.`
    };

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      message: 'Falha na migração. Seus dados no localStorage não foram alterados.'
    };
  }
}

/**
 * Verifica se existem dados no localStorage que precisam ser migrados
 */
export function checkIfMigrationNeeded(): { needed: boolean; requisitionsCount: number; purchaseOrdersCount: number } {
  const requisitionsData = localStorage.getItem('requisitions');
  const purchaseOrdersData = localStorage.getItem('purchaseOrderItems');

  const requisitions: Requisition[] = requisitionsData ? JSON.parse(requisitionsData) : [];
  const purchaseOrders: PurchaseOrderItem[] = purchaseOrdersData ? JSON.parse(purchaseOrdersData) : [];

  return {
    needed: requisitions.length > 0 || purchaseOrders.length > 0,
    requisitionsCount: requisitions.length,
    purchaseOrdersCount: purchaseOrders.length
  };
}
