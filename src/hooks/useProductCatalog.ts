import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  ProductCatalog,
  ProductSupplier,
  ProductPriceHistory,
  CatalogFilterState,
  CatalogMetrics
} from '../types';

function convertCatalogFromSupabase(data: any): ProductCatalog {
  return {
    id: data.id,
    codigo: data.codigo || '',
    descricao: data.descricao,
    categoria: data.categoria || '',
    unidadeMedida: data.unidade_medida || '',
    ncm: data.ncm || '',
    observacoes: data.observacoes || '',
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

function convertSupplierFromSupabase(data: any): ProductSupplier {
  return {
    id: data.id,
    productCatalogId: data.product_catalog_id,
    nomeFornecedor: data.nome_fornecedor,
    codigoFornecedor: data.codigo_fornecedor || '',
    ativo: data.ativo !== false,
    observacoes: data.observacoes || '',
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

function convertPriceHistoryFromSupabase(data: any): ProductPriceHistory {
  return {
    id: data.id,
    productCatalogId: data.product_catalog_id,
    productSupplierId: data.product_supplier_id || null,
    valor: data.valor || 0,
    moeda: data.moeda || 'BRL',
    dataReferencia: data.data_referencia,
    purchaseOrderItemId: data.purchase_order_item_id || null,
    requisitionId: data.requisition_id || null,
    fornecedorNome: data.fornecedor_nome || '',
    numeroPo: data.numero_po || '',
    origem: data.origem || 'Manual',
    observacoes: data.observacoes || '',
    createdAt: data.created_at
  };
}

export function useProductCatalog() {
  const [products, setProducts] = useState<ProductCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<CatalogFilterState>({
    descricaoSearch: '',
    categoriaFilter: '',
    fornecedorFilter: ''
  });

  const loadProducts = async (filters?: CatalogFilterState) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('product_catalog')
        .select('*');

      if (filters?.descricaoSearch) {
        query = query.ilike('descricao', `%${filters.descricaoSearch}%`);
      }

      if (filters?.categoriaFilter) {
        query = query.eq('categoria', filters.categoriaFilter);
      }

      const { data, error: queryError } = await query.order('descricao', { ascending: true });

      if (queryError) throw queryError;

      const converted = (data || []).map(convertCatalogFromSupabase);

      const productsWithMeta = await Promise.all(
        converted.map(async (product) => {
          const { data: supplierData } = await supabase
            .from('product_suppliers')
            .select('id')
            .eq('product_catalog_id', product.id)
            .eq('ativo', true);

          const { data: lastPriceData } = await supabase
            .from('product_price_history')
            .select('*')
            .eq('product_catalog_id', product.id)
            .order('data_referencia', { ascending: false })
            .limit(1);

          return {
            ...product,
            supplierCount: supplierData?.length || 0,
            lastPrice: lastPriceData?.[0] ? convertPriceHistoryFromSupabase(lastPriceData[0]) : null
          };
        })
      );

      let finalProducts = productsWithMeta;
      if (filters?.fornecedorFilter) {
        const { data: supplierMatches } = await supabase
          .from('product_suppliers')
          .select('product_catalog_id')
          .ilike('nome_fornecedor', `%${filters.fornecedorFilter}%`);

        const matchedIds = new Set((supplierMatches || []).map((s: any) => s.product_catalog_id));
        finalProducts = productsWithMeta.filter(p => matchedIds.has(p.id));
      }

      setProducts(finalProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar catalogo');
      console.error('Erro ao carregar catalogo:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProductDetail = async (id: string): Promise<ProductCatalog | null> => {
    try {
      const { data: productData, error: productError } = await supabase
        .from('product_catalog')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (productError) throw productError;
      if (!productData) return null;

      const product = convertCatalogFromSupabase(productData);

      const { data: suppliersData } = await supabase
        .from('product_suppliers')
        .select('*')
        .eq('product_catalog_id', id)
        .order('nome_fornecedor', { ascending: true });

      const suppliers: ProductSupplier[] = (suppliersData || []).map(convertSupplierFromSupabase);

      const suppliersWithLastPrice = await Promise.all(
        suppliers.map(async (supplier) => {
          const { data: lastPriceData } = await supabase
            .from('product_price_history')
            .select('*')
            .eq('product_catalog_id', id)
            .eq('product_supplier_id', supplier.id)
            .order('data_referencia', { ascending: false })
            .limit(1);

          return {
            ...supplier,
            lastPrice: lastPriceData?.[0] ? convertPriceHistoryFromSupabase(lastPriceData[0]) : null
          };
        })
      );

      const { data: historyData } = await supabase
        .from('product_price_history')
        .select('*')
        .eq('product_catalog_id', id)
        .order('data_referencia', { ascending: false });

      const priceHistory: ProductPriceHistory[] = (historyData || []).map(convertPriceHistoryFromSupabase);

      return {
        ...product,
        suppliers: suppliersWithLastPrice,
        priceHistory,
        supplierCount: suppliersWithLastPrice.filter(s => s.ativo).length,
        lastPrice: priceHistory[0] || null
      };
    } catch (err) {
      console.error('Erro ao carregar detalhe do produto:', err);
      return null;
    }
  };

  const addProduct = async (data: Omit<ProductCatalog, 'id' | 'createdAt' | 'updatedAt' | 'suppliers' | 'priceHistory' | 'lastPrice' | 'supplierCount'>): Promise<ProductCatalog | null> => {
    try {
      const { data: inserted, error: insertError } = await supabase
        .from('product_catalog')
        .insert([{
          codigo: data.codigo || '',
          descricao: data.descricao,
          categoria: data.categoria || '',
          unidade_medida: data.unidadeMedida || '',
          ncm: data.ncm || '',
          observacoes: data.observacoes || ''
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      const newProduct = convertCatalogFromSupabase(inserted);
      await loadProducts(currentFilters);
      return newProduct;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar produto');
      console.error('Erro ao adicionar produto:', err);
      return null;
    }
  };

  const updateProduct = async (id: string, data: Partial<ProductCatalog>): Promise<boolean> => {
    try {
      const updates: any = {};
      if (data.codigo !== undefined) updates.codigo = data.codigo;
      if (data.descricao !== undefined) updates.descricao = data.descricao;
      if (data.categoria !== undefined) updates.categoria = data.categoria;
      if (data.unidadeMedida !== undefined) updates.unidade_medida = data.unidadeMedida;
      if (data.ncm !== undefined) updates.ncm = data.ncm;
      if (data.observacoes !== undefined) updates.observacoes = data.observacoes;

      const { error: updateError } = await supabase
        .from('product_catalog')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      await loadProducts(currentFilters);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar produto');
      console.error('Erro ao atualizar produto:', err);
      return false;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('product_catalog')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setProducts(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar produto');
      console.error('Erro ao deletar produto:', err);
      return false;
    }
  };

  const addSupplier = async (productCatalogId: string, supplierData: { nomeFornecedor: string; codigoFornecedor?: string; observacoes?: string }): Promise<ProductSupplier | null> => {
    try {
      const { data: existing } = await supabase
        .from('product_suppliers')
        .select('id')
        .eq('product_catalog_id', productCatalogId)
        .ilike('nome_fornecedor', supplierData.nomeFornecedor)
        .maybeSingle();

      if (existing) {
        const { data: updated } = await supabase
          .from('product_suppliers')
          .update({ ativo: true, codigo_fornecedor: supplierData.codigoFornecedor || '', observacoes: supplierData.observacoes || '' })
          .eq('id', existing.id)
          .select()
          .single();
        return updated ? convertSupplierFromSupabase(updated) : null;
      }

      const { data: inserted, error: insertError } = await supabase
        .from('product_suppliers')
        .insert([{
          product_catalog_id: productCatalogId,
          nome_fornecedor: supplierData.nomeFornecedor,
          codigo_fornecedor: supplierData.codigoFornecedor || '',
          ativo: true,
          observacoes: supplierData.observacoes || ''
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return inserted ? convertSupplierFromSupabase(inserted) : null;
    } catch (err) {
      console.error('Erro ao adicionar fornecedor:', err);
      return null;
    }
  };

  const addPriceHistory = async (entry: {
    productCatalogId: string;
    productSupplierId?: string | null;
    valor: number;
    moeda?: string;
    dataReferencia?: string;
    purchaseOrderItemId?: string | null;
    requisitionId?: string | null;
    fornecedorNome?: string;
    numeroPo?: string;
    origem?: 'PO' | 'Cotacao' | 'Manual';
    observacoes?: string;
  }): Promise<ProductPriceHistory | null> => {
    try {
      const { data: inserted, error: insertError } = await supabase
        .from('product_price_history')
        .insert([{
          product_catalog_id: entry.productCatalogId,
          product_supplier_id: entry.productSupplierId || null,
          valor: entry.valor,
          moeda: entry.moeda || 'BRL',
          data_referencia: entry.dataReferencia || new Date().toISOString().split('T')[0],
          purchase_order_item_id: entry.purchaseOrderItemId || null,
          requisition_id: entry.requisitionId || null,
          fornecedor_nome: entry.fornecedorNome || '',
          numero_po: entry.numeroPo || '',
          origem: entry.origem || 'Manual',
          observacoes: entry.observacoes || ''
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return inserted ? convertPriceHistoryFromSupabase(inserted) : null;
    } catch (err) {
      console.error('Erro ao adicionar historico de preco:', err);
      return null;
    }
  };

  const findOrCreateProduct = async (descricao: string, extra?: { codigo?: string; categoria?: string; ncm?: string }): Promise<string | null> => {
    try {
      const { data: existing } = await supabase
        .from('product_catalog')
        .select('id')
        .ilike('descricao', descricao)
        .maybeSingle();

      if (existing) return existing.id;

      const { data: inserted, error: insertError } = await supabase
        .from('product_catalog')
        .insert([{
          descricao,
          codigo: extra?.codigo || '',
          categoria: extra?.categoria || '',
          ncm: extra?.ncm || '',
          unidade_medida: '',
          observacoes: ''
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return inserted?.id || null;
    } catch (err) {
      console.error('Erro ao criar produto no catalogo:', err);
      return null;
    }
  };

  const migrateFromExistingData = async (
    onProgress?: (current: number, total: number, message: string) => void
  ): Promise<{ created: number; pricesAdded: number; errors: number }> => {
    let created = 0;
    let pricesAdded = 0;
    let errors = 0;

    try {
      const { data: poItems } = await supabase
        .from('purchase_order_items')
        .select('*')
        .order('data_entrega', { ascending: false });

      const { data: quotations } = await supabase
        .from('quotations')
        .select('*, requisitions(item, rc, project)');

      const allItems = poItems || [];
      const allQuotations = quotations || [];
      const total = allItems.length + allQuotations.length;
      let current = 0;

      for (const item of allItems) {
        current++;
        if (onProgress) onProgress(current, total, `Processando PO: ${item.numero_po} - ${item.descricao_item}`);

        try {
          const productId = await findOrCreateProduct(
            item.descricao_item,
            { codigo: item.cod_item || '', ncm: item.ncm || '' }
          );

          if (!productId) { errors++; continue; }

          const isNew = await (async () => {
            const { data: existingProduct } = await supabase
              .from('product_catalog')
              .select('created_at')
              .eq('id', productId)
              .single();
            const createdAt = new Date(existingProduct?.created_at || 0).getTime();
            return Date.now() - createdAt < 5000;
          })();

          if (isNew) created++;

          if (item.valor_unitario && item.valor_unitario > 0) {
            const { data: existing } = await supabase
              .from('product_price_history')
              .select('id')
              .eq('purchase_order_item_id', item.id)
              .maybeSingle();

            if (!existing) {
              let supplierId: string | null = null;

              if (item.numero_po) {
                const { data: reqData } = await supabase
                  .from('requisitions')
                  .select('supplier, quoted_supplier')
                  .eq('id', item.requisition_id || '')
                  .maybeSingle();

                const supplierName = reqData?.supplier || reqData?.quoted_supplier || '';
                if (supplierName) {
                  const supplier = await addSupplier(productId, { nomeFornecedor: supplierName });
                  supplierId = supplier?.id || null;
                }
              }

              await addPriceHistory({
                productCatalogId: productId,
                productSupplierId: supplierId,
                valor: item.valor_unitario,
                moeda: item.moeda || 'BRL',
                dataReferencia: item.data_entrega || item.data_po || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                purchaseOrderItemId: item.id,
                fornecedorNome: '',
                numeroPo: item.numero_po || '',
                origem: 'PO'
              });
              pricesAdded++;
            }
          }
        } catch (err) {
          errors++;
          console.error('Erro ao processar item:', err);
        }
      }

      for (const quotation of allQuotations) {
        current++;
        if (onProgress) onProgress(current, total, `Processando cotacao: ${quotation.supplier_name}`);

        try {
          const reqItem = (quotation as any).requisitions?.item || '';
          if (!reqItem) { errors++; continue; }

          const productId = await findOrCreateProduct(reqItem);
          if (!productId) { errors++; continue; }

          if (quotation.value && quotation.value > 0) {
            const { data: existing } = await supabase
              .from('product_price_history')
              .select('id')
              .eq('product_catalog_id', productId)
              .eq('fornecedor_nome', quotation.supplier_name)
              .eq('origem', 'Cotacao')
              .maybeSingle();

            if (!existing) {
              const supplier = await addSupplier(productId, { nomeFornecedor: quotation.supplier_name });

              await addPriceHistory({
                productCatalogId: productId,
                productSupplierId: supplier?.id || null,
                valor: quotation.value,
                moeda: 'BRL',
                dataReferencia: quotation.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                requisitionId: quotation.requisition_id,
                fornecedorNome: quotation.supplier_name,
                numeroPo: '',
                origem: 'Cotacao'
              });
              pricesAdded++;
            }
          }
        } catch (err) {
          errors++;
          console.error('Erro ao processar cotacao:', err);
        }
      }

      await loadProducts(currentFilters);
    } catch (err) {
      console.error('Erro durante migracao:', err);
      errors++;
    }

    return { created, pricesAdded, errors };
  };

  const filterProducts = async (filters: CatalogFilterState) => {
    setCurrentFilters(filters);
    await loadProducts(filters);
  };

  const getMetrics = (): CatalogMetrics => {
    const totalProducts = products.length;
    const totalSuppliers = products.reduce((sum, p) => sum + (p.supplierCount || 0), 0);
    const productsWithHistory = products.filter(p => p.lastPrice !== null && p.lastPrice !== undefined).length;
    const productsWithPrice = products.filter(p => p.lastPrice?.valor);
    const avgPrice = productsWithPrice.length > 0
      ? productsWithPrice.reduce((sum, p) => sum + (p.lastPrice?.valor || 0), 0) / productsWithPrice.length
      : 0;

    return { totalProducts, totalSuppliers, productsWithHistory, avgPrice };
  };

  const getUniqueCategories = (): string[] => {
    return [...new Set(products.map(p => p.categoria).filter(Boolean))].sort();
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return {
    products,
    loading,
    error,
    currentFilters,
    loadProducts,
    getProductDetail,
    addProduct,
    updateProduct,
    deleteProduct,
    addSupplier,
    addPriceHistory,
    findOrCreateProduct,
    migrateFromExistingData,
    filterProducts,
    getMetrics,
    getUniqueCategories
  };
}
