import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PurchaseOrderItem, PurchaseOrderFilterState, PurchaseOrderMetrics } from '../types';
import { createLocalDate } from '../utils/dateHelpers';

// Função auxiliar para extrair número do RC/PO e ordenar
function sortByNumberDescending<T extends { rc?: string; numeroPo?: string }>(
  items: T[],
  field: 'rc' | 'numeroPo'
): T[] {
  return [...items].sort((a, b) => {
    const valueA = field === 'rc' ? a.rc : a.numeroPo;
    const valueB = field === 'rc' ? b.rc : b.numeroPo;

    // Extrair apenas os dígitos
    const numA = parseInt((valueA || '').replace(/\D/g, ''), 10) || 0;
    const numB = parseInt((valueB || '').replace(/\D/g, ''), 10) || 0;

    // Ordem decrescente: maiores primeiro (1900 antes de 673)
    return numB - numA;
  });
}

function convertFromSupabase(data: any): PurchaseOrderItem {
  const formatDateField = (dateValue: any): string => {
    if (!dateValue) return '';

    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  return {
    id: data.id,
    numeroPo: data.numero_po,
    ultimaAtualizacao: formatDateField(data.ultima_atualizacao),
    dataPo: formatDateField(data.data_po),
    codItem: data.cod_item,
    descricaoItem: data.descricao_item,
    ncm: data.ncm || '',
    garantia: data.garantia || '',
    quantidade: data.quantidade || 0,
    quantidadeEntregue: data.quantidade_entregue || 0,
    valorUnitario: data.valor_unitario || 0,
    moeda: data.moeda || 'BRL',
    condicoesPagamento: data.condicoes_pagamento || '',
    dataEntrega: formatDateField(data.data_entrega),
    status: data.status,
    observacoes: data.observacoes || '',
    requisitionId: data.requisition_id || '',
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

function convertToSupabase(data: Omit<PurchaseOrderItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const formatDateForSupabase = (dateValue: string): string | null => {
    if (!dateValue || dateValue.trim() === '') return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch {
      return null;
    }
  };

  return {
    numero_po: data.numeroPo,
    ultima_atualizacao: formatDateForSupabase(data.ultimaAtualizacao) || new Date().toISOString().split('T')[0],
    data_po: formatDateForSupabase(data.dataPo),
    cod_item: data.codItem || null,
    descricao_item: data.descricaoItem,
    ncm: data.ncm || null,
    garantia: data.garantia || null,
    quantidade: data.quantidade || 0,
    quantidade_entregue: data.quantidadeEntregue || 0,
    valor_unitario: data.valorUnitario || 0,
    moeda: data.moeda || 'BRL',
    condicoes_pagamento: data.condicoesPagamento || null,
    data_entrega: formatDateForSupabase(data.dataEntrega),
    status: data.status,
    observacoes: data.observacoes || null,
    requisition_id: data.requisitionId || null
  };
}

export function useSupabasePurchaseOrders() {
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PurchaseOrderItem[]>([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<PurchaseOrderItem[]>([]);
  const [currentActiveFilters, setCurrentActiveFilters] = useState<PurchaseOrderFilterState>({
    poSearch: '',
    itemCodeSearch: '',
    itemDescriptionSearch: '',
    statusSearch: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select('*')
        .order('numero_po', { ascending: false });

      if (error) throw error;

      const convertedData = data?.map(convertFromSupabase) || [];

      // Ordenar por número do PO numérico (números maiores primeiro)
      const sorted = sortByNumberDescending(convertedData, 'numeroPo');

      setItems(sorted);
      setFilteredItems(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar itens');
      console.error('Erro ao carregar itens:', err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item: Omit<PurchaseOrderItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const supabaseData = convertToSupabase(item);
      const { data, error } = await supabase
        .from('purchase_order_items')
        .insert([supabaseData])
        .select()
        .single();

      if (error) throw error;

      const newItem = convertFromSupabase(data);

      // Adicionar e reordenar
      setItems(prev => {
        const updated = [newItem, ...prev];
        return sortByNumberDescending(updated, 'numeroPo');
      });

      setFilteredItems(prev => {
        const updated = [newItem, ...prev];
        return sortByNumberDescending(updated, 'numeroPo');
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar item');
      console.error('Erro ao adicionar item:', err);
    }
  };

  const updateItem = async (id: string, updates: Partial<PurchaseOrderItem>) => {
    try {
      const formatDateForSupabase = (dateValue: string): string | null => {
        if (!dateValue || dateValue.trim() === '') return null;

        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return dateValue;
        }

        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return null;

          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');

          return `${year}-${month}-${day}`;
        } catch {
          return null;
        }
      };

      const supabaseUpdates: any = {};

      if (updates.numeroPo !== undefined) supabaseUpdates.numero_po = updates.numeroPo;
      if (updates.ultimaAtualizacao !== undefined) supabaseUpdates.ultima_atualizacao = formatDateForSupabase(updates.ultimaAtualizacao);
      if (updates.dataPo !== undefined) supabaseUpdates.data_po = formatDateForSupabase(updates.dataPo);
      if (updates.codItem !== undefined) supabaseUpdates.cod_item = updates.codItem;
      if (updates.descricaoItem !== undefined) supabaseUpdates.descricao_item = updates.descricaoItem;
      if (updates.ncm !== undefined) supabaseUpdates.ncm = updates.ncm || null;
      if (updates.garantia !== undefined) supabaseUpdates.garantia = updates.garantia || null;
      if (updates.quantidade !== undefined) supabaseUpdates.quantidade = updates.quantidade || 0;
      if (updates.quantidadeEntregue !== undefined) supabaseUpdates.quantidade_entregue = updates.quantidadeEntregue || 0;
      if (updates.valorUnitario !== undefined) supabaseUpdates.valor_unitario = updates.valorUnitario || 0;
      if (updates.moeda !== undefined) supabaseUpdates.moeda = updates.moeda;
      if (updates.condicoesPagamento !== undefined) supabaseUpdates.condicoes_pagamento = updates.condicoesPagamento || null;
      if (updates.dataEntrega !== undefined) supabaseUpdates.data_entrega = formatDateForSupabase(updates.dataEntrega);
      if (updates.status !== undefined) supabaseUpdates.status = updates.status;
      if (updates.observacoes !== undefined) supabaseUpdates.observacoes = updates.observacoes || null;
      if (updates.requisitionId !== undefined) supabaseUpdates.requisition_id = updates.requisitionId || null;

      const { data, error } = await supabase
        .from('purchase_order_items')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedItem = convertFromSupabase(data);

      setItems(prev => {
        const updated = prev.map(item => item.id === id ? updatedItem : item);
        return sortByNumberDescending(updated, 'numeroPo');
      });

      setFilteredItems(prev => {
        const updated = prev.map(item => item.id === id ? updatedItem : item);
        return sortByNumberDescending(updated, 'numeroPo');
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar item');
      console.error('Erro ao atualizar item:', err);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('purchase_order_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== id));
      setFilteredItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar item');
      console.error('Erro ao deletar item:', err);
    }
  };

  const bulkImport = async (newItems: PurchaseOrderItem[]) => {
    try {
      const supabaseData = newItems.map((item) => {
        const { id, createdAt, updatedAt, ...itemData } = item;
        return convertToSupabase(itemData);
      });

      const { data, error } = await supabase
        .from('purchase_order_items')
        .insert(supabaseData)
        .select();

      if (error) throw error;

      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar itens');
      throw err;
    }
  };

  const filterItems = (filters: PurchaseOrderFilterState) => {
    setCurrentActiveFilters(filters);

    let filtered = items;

    if (filters.poSearch) {
      const searchLower = filters.poSearch.toLowerCase();
      filtered = filtered.filter(item =>
        item.numeroPo.toLowerCase().includes(searchLower)
      );
    }

    if (filters.itemCodeSearch) {
      const searchLower = filters.itemCodeSearch.toLowerCase();
      filtered = filtered.filter(item =>
        item.codItem.toLowerCase().includes(searchLower)
      );
    }

    if (filters.itemDescriptionSearch) {
      const searchLower = filters.itemDescriptionSearch.toLowerCase();
      filtered = filtered.filter(item =>
        item.descricaoItem.toLowerCase().includes(searchLower)
      );
    }

    if (filters.statusSearch) {
      filtered = filtered.filter(item => item.status === filters.statusSearch);
    }

    if (filters.currencyFilter && filters.currencyFilter !== 'all') {
      filtered = filtered.filter(item => item.moeda === filters.currencyFilter);
    }

    if (filters.deliveryFilter && filters.deliveryFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(item => {
        if (!item.dataEntrega) return false;

        if (item.status === 'Entregue' || item.status === 'Cancelado') return false;

        const deliveryDate = createLocalDate(item.dataEntrega);
        deliveryDate.setHours(0, 0, 0, 0);

        const isDelayed = deliveryDate < today;

        const fiveDaysFromNow = new Date(today);
        fiveDaysFromNow.setDate(today.getDate() + 5);
        const isUpcoming = deliveryDate >= today && deliveryDate <= fiveDaysFromNow;

        switch (filters.deliveryFilter) {
          case 'delayed':
            return isDelayed;
          case 'upcoming':
            return isUpcoming && !isDelayed;
          case 'attention':
            return isDelayed || isUpcoming;
          default:
            return true;
        }
      });
    }

    // Manter ordenação por número do PO após filtrar
    sortByNumberDescending(filtered, 'numeroPo');

    setFilteredItems(filtered);
  };

  const getMetrics = (): PurchaseOrderMetrics => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeItems = items.filter(item =>
      item.status !== 'Entregue' && item.status !== 'Cancelado'
    );

    const delayedDeliveries = activeItems.filter(item => {
      if (!item.dataEntrega) return false;
      const deliveryDate = createLocalDate(item.dataEntrega);
      deliveryDate.setHours(0, 0, 0, 0);
      return deliveryDate < today;
    }).length;

    const upcomingDeliveries = activeItems.filter(item => {
      if (!item.dataEntrega) return false;
      const deliveryDate = createLocalDate(item.dataEntrega);
      deliveryDate.setHours(0, 0, 0, 0);
      const fiveDaysFromNow = new Date(today);
      fiveDaysFromNow.setDate(today.getDate() + 5);
      return deliveryDate >= today && deliveryDate <= fiveDaysFromNow;
    }).length;

    const totalValue = items.reduce((sum, item) => {
      const itemTotal = item.valorUnitario * item.quantidade;
      return sum + itemTotal;
    }, 0);

    return {
      totalItems: items.length,
      pendingDelivery: items.filter(item => item.status === 'Pedido' || item.status === 'Em Trânsito' || item.status === 'Aguardando Fornecedor').length,
      partiallyDelivered: items.filter(item => item.status === 'Parcialmente Entregue').length,
      completed: items.filter(item => item.status === 'Entregue').length,
      totalValue,
      delayedDeliveries,
      upcomingDeliveries
    };
  };

  const getUniqueValues = () => {
    return {
      purchaseOrders: [...new Set(items.map(item => item.numeroPo).filter(Boolean))],
      itemCodes: [...new Set(items.map(item => item.codItem).filter(Boolean))],
      currencies: [...new Set(items.map(item => item.moeda).filter(Boolean))]
    };
  };

  const calculateUpcomingDeliveries = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeItems = items.filter(item =>
      item.status !== 'Entregue' && item.status !== 'Cancelado'
    );

    const upcoming = activeItems.filter(item => {
      if (!item.dataEntrega) return false;
      const deliveryDate = createLocalDate(item.dataEntrega);
      deliveryDate.setHours(0, 0, 0, 0);
      const fiveDaysFromNow = new Date(today);
      fiveDaysFromNow.setDate(today.getDate() + 5);
      return deliveryDate >= today && deliveryDate <= fiveDaysFromNow;
    });

    setUpcomingDeliveries(upcoming);
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    filterItems(currentActiveFilters);
    calculateUpcomingDeliveries();
  }, [items, currentActiveFilters]);

  return {
    items,
    filteredItems,
    upcomingDeliveries,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    bulkImport,
    filterItems,
    getMetrics,
    getUniqueValues,
    reloadItems: loadItems
  };
}
