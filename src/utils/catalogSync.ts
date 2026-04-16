import { supabase } from '../lib/supabase';

async function findOrCreateCatalogProduct(descricao: string, extra?: { codigo?: string; ncm?: string }): Promise<string | null> {
  try {
    const { data: existing } = await supabase
      .from('product_catalog')
      .select('id')
      .ilike('descricao', descricao)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: inserted, error } = await supabase
      .from('product_catalog')
      .insert([{
        descricao,
        codigo: extra?.codigo || '',
        ncm: extra?.ncm || '',
        categoria: '',
        unidade_medida: '',
        observacoes: ''
      }])
      .select()
      .single();

    if (error) return null;
    return inserted?.id || null;
  } catch {
    return null;
  }
}

async function findOrCreateSupplier(productCatalogId: string, nomeFornecedor: string): Promise<string | null> {
  if (!nomeFornecedor?.trim()) return null;
  try {
    const { data: existing } = await supabase
      .from('product_suppliers')
      .select('id')
      .eq('product_catalog_id', productCatalogId)
      .ilike('nome_fornecedor', nomeFornecedor.trim())
      .maybeSingle();

    if (existing) return existing.id;

    const { data: inserted, error } = await supabase
      .from('product_suppliers')
      .insert([{
        product_catalog_id: productCatalogId,
        nome_fornecedor: nomeFornecedor.trim(),
        codigo_fornecedor: '',
        ativo: true,
        observacoes: ''
      }])
      .select()
      .single();

    if (error) return null;
    return inserted?.id || null;
  } catch {
    return null;
  }
}

export async function syncPurchaseOrderItemToCatalog(itemData: {
  id: string;
  descricaoItem: string;
  codItem?: string;
  ncm?: string;
  valorUnitario: number;
  moeda: string;
  dataEntrega?: string;
  dataPo?: string;
  numeroPo: string;
  fornecedorNome?: string;
}): Promise<void> {
  try {
    if (!itemData.descricaoItem?.trim()) return;
    if (!itemData.valorUnitario || itemData.valorUnitario <= 0) return;

    const productId = await findOrCreateCatalogProduct(
      itemData.descricaoItem.trim(),
      { codigo: itemData.codItem, ncm: itemData.ncm }
    );

    if (!productId) return;

    const { data: existingEntry } = await supabase
      .from('product_price_history')
      .select('id')
      .eq('purchase_order_item_id', itemData.id)
      .maybeSingle();

    if (existingEntry) return;

    let supplierId: string | null = null;
    if (itemData.fornecedorNome) {
      supplierId = await findOrCreateSupplier(productId, itemData.fornecedorNome);
    }

    const dataRef = itemData.dataEntrega || itemData.dataPo || new Date().toISOString().split('T')[0];

    await supabase
      .from('product_price_history')
      .insert([{
        product_catalog_id: productId,
        product_supplier_id: supplierId,
        valor: itemData.valorUnitario,
        moeda: itemData.moeda || 'BRL',
        data_referencia: dataRef,
        purchase_order_item_id: itemData.id,
        fornecedor_nome: itemData.fornecedorNome || '',
        numero_po: itemData.numeroPo || '',
        origem: 'PO',
        observacoes: ''
      }]);
  } catch (err) {
    console.warn('Catalog sync (PO) silently failed:', err);
  }
}

export async function syncQuotationToCatalog(quotationData: {
  id: string;
  requisitionId: string;
  itemDescricao: string;
  supplierName: string;
  value: number;
  createdAt?: string;
}): Promise<void> {
  try {
    if (!quotationData.itemDescricao?.trim()) return;
    if (!quotationData.value || quotationData.value <= 0) return;

    const productId = await findOrCreateCatalogProduct(quotationData.itemDescricao.trim());
    if (!productId) return;

    const { data: existingEntry } = await supabase
      .from('product_price_history')
      .select('id')
      .eq('product_catalog_id', productId)
      .eq('fornecedor_nome', quotationData.supplierName)
      .eq('origem', 'Cotacao')
      .eq('requisition_id', quotationData.requisitionId)
      .maybeSingle();

    if (existingEntry) return;

    let supplierId: string | null = null;
    if (quotationData.supplierName) {
      supplierId = await findOrCreateSupplier(productId, quotationData.supplierName);
    }

    const dataRef = quotationData.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0];

    await supabase
      .from('product_price_history')
      .insert([{
        product_catalog_id: productId,
        product_supplier_id: supplierId,
        valor: quotationData.value,
        moeda: 'BRL',
        data_referencia: dataRef,
        requisition_id: quotationData.requisitionId,
        fornecedor_nome: quotationData.supplierName,
        numero_po: '',
        origem: 'Cotacao',
        observacoes: ''
      }]);
  } catch (err) {
    console.warn('Catalog sync (Quotacao) silently failed:', err);
  }
}
