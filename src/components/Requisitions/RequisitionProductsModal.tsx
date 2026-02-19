import React, { useState, useEffect } from 'react';
import { X, Plus, Package, DollarSign, TrendingUp } from 'lucide-react';
import { Requisition, PurchaseOrderItem } from '../../types';
import { supabase } from '../../lib/supabase';
import { PurchaseOrderItemsTable } from '../PurchaseOrders/PurchaseOrderItemsTable';
import { PurchaseOrderItemForm } from '../PurchaseOrders/PurchaseOrderItemForm';
import { STATUS_COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import { createLocalDate } from '../../utils/dateHelpers';

interface RequisitionProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: Requisition | null;
  isDarkMode?: boolean;
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
    cod_item: data.codItem,
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

export function RequisitionProductsModal({
  isOpen,
  onClose,
  requisition,
  isDarkMode = false
}: RequisitionProductsModalProps) {
  const [products, setProducts] = useState<PurchaseOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PurchaseOrderItem | null>(null);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<PurchaseOrderItem[]>([]);

  useEffect(() => {
    if (isOpen && requisition) {
      loadProducts();
    }
  }, [isOpen, requisition]);

  const loadProducts = async () => {
    if (!requisition) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('requisition_id', requisition.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const convertedData = data?.map(convertFromSupabase) || [];
      setProducts(convertedData);
      calculateUpcomingDeliveries(convertedData);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateUpcomingDeliveries = (items: PurchaseOrderItem[]) => {
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

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setProductFormOpen(true);
  };

  const getDefaultProductData = () => {
    return {
      numeroPo: requisition?.rc || '',
      requisitionId: requisition?.id || ''
    };
  };

  const handleEditProduct = (product: PurchaseOrderItem) => {
    setSelectedProduct(product);
    setProductFormOpen(true);
  };

  const handleSaveProduct = async (productData: Omit<PurchaseOrderItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const dataWithRequisition = {
        ...productData,
        requisitionId: requisition!.id
      };

      if (selectedProduct) {
        // Atualizar produto existente
        const supabaseUpdates: any = {};
        
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
        
        supabaseUpdates.numero_po = dataWithRequisition.numeroPo;
        supabaseUpdates.ultima_atualizacao = formatDateForSupabase(dataWithRequisition.ultimaAtualizacao) || new Date().toISOString().split('T')[0];
        supabaseUpdates.data_po = formatDateForSupabase(dataWithRequisition.dataPo);
        supabaseUpdates.cod_item = dataWithRequisition.codItem || null;
        supabaseUpdates.descricao_item = dataWithRequisition.descricaoItem;
        supabaseUpdates.ncm = dataWithRequisition.ncm || null;
        supabaseUpdates.garantia = dataWithRequisition.garantia || null;
        supabaseUpdates.quantidade = dataWithRequisition.quantidade || 0;
        supabaseUpdates.quantidade_entregue = dataWithRequisition.quantidadeEntregue || 0;
        supabaseUpdates.valor_unitario = dataWithRequisition.valorUnitario || 0;
        supabaseUpdates.moeda = dataWithRequisition.moeda || 'BRL';
        supabaseUpdates.condicoes_pagamento = dataWithRequisition.condicoesPagamento || null;
        supabaseUpdates.data_entrega = formatDateForSupabase(dataWithRequisition.dataEntrega);
        supabaseUpdates.status = dataWithRequisition.status;
        supabaseUpdates.observacoes = dataWithRequisition.observacoes || null;
        supabaseUpdates.requisition_id = requisition!.id;

        const { error } = await supabase
          .from('purchase_order_items')
          .update(supabaseUpdates)
          .eq('id', selectedProduct.id);

        if (error) throw error;
      } else {
        // Criar novo produto
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
        
        const supabaseData = {
          numero_po: dataWithRequisition.numeroPo,
          ultima_atualizacao: formatDateForSupabase(dataWithRequisition.ultimaAtualizacao) || new Date().toISOString().split('T')[0],
          data_po: formatDateForSupabase(dataWithRequisition.dataPo),
          cod_item: dataWithRequisition.codItem || null,
          descricao_item: dataWithRequisition.descricaoItem,
          ncm: dataWithRequisition.ncm || null,
          garantia: dataWithRequisition.garantia || null,
          quantidade: dataWithRequisition.quantidade || 0,
          quantidade_entregue: dataWithRequisition.quantidadeEntregue || 0,
          valor_unitario: dataWithRequisition.valorUnitario || 0,
          moeda: dataWithRequisition.moeda || 'BRL',
          condicoes_pagamento: dataWithRequisition.condicoesPagamento || null,
          data_entrega: formatDateForSupabase(dataWithRequisition.dataEntrega),
          status: dataWithRequisition.status,
          observacoes: dataWithRequisition.observacoes || null,
          requisition_id: requisition!.id
        };
        
        const { error } = await supabase
          .from('purchase_order_items')
          .insert([supabaseData]);

        if (error) throw error;
      }

      await loadProducts();
      setProductFormOpen(false);
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      alert(`Erro ao salvar produto: ${errorMessage}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('purchase_order_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadProducts();
    } catch (err) {
      console.error('Erro ao deletar produto:', err);
      alert('Erro ao deletar produto. Tente novamente.');
    }
  };

  const handleUpdateProduct = async (id: string, field: keyof PurchaseOrderItem, value: any) => {
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

      const fieldMap: Record<string, string> = {
        numeroPo: 'numero_po',
        ultimaAtualizacao: 'ultima_atualizacao',
        dataPo: 'data_po',
        codItem: 'cod_item',
        descricaoItem: 'descricao_item',
        ncm: 'ncm',
        garantia: 'garantia',
        quantidade: 'quantidade',
        quantidadeEntregue: 'quantidade_entregue',
        valorUnitario: 'valor_unitario',
        moeda: 'moeda',
        condicoesPagamento: 'condicoes_pagamento',
        dataEntrega: 'data_entrega',
        status: 'status',
        observacoes: 'observacoes',
        requisitionId: 'requisition_id'
      };

      const dbField = fieldMap[field] || field;

      if (field === 'ultimaAtualizacao' || field === 'dataPo' || field === 'dataEntrega') {
        supabaseUpdates[dbField] = formatDateForSupabase(value as string);
      } else {
        supabaseUpdates[dbField] = value;
      }

      const { error } = await supabase
        .from('purchase_order_items')
        .update(supabaseUpdates)
        .eq('id', id);

      if (error) throw error;

      await loadProducts();
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
    }
  };

  const calculateTotals = () => {
    const totalItems = products.length;
    const totalQuantity = products.reduce((sum, p) => sum + p.quantidade, 0);
    const totalValue = products.reduce((sum, p) => sum + (p.valorUnitario * p.quantidade), 0);
    const deliveredQuantity = products.reduce((sum, p) => sum + p.quantidadeEntregue, 0);
    const pendingQuantity = totalQuantity - deliveredQuantity;

    return { totalItems, totalQuantity, totalValue, deliveredQuantity, pendingQuantity };
  };

  const getUniqueValues = () => {
    return {
      purchaseOrders: [...new Set(products.map(p => p.numeroPo).filter(Boolean))],
      itemCodes: [...new Set(products.map(p => p.codItem).filter(Boolean))]
    };
  };

  if (!isOpen || !requisition) return null;

  const totals = calculateTotals();

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className={`rounded-xl shadow-xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Header */}
          <div className={`px-6 py-4 border-b flex items-center justify-between ${
            isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
                isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
              }`}>
                <Package className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Produtos da Requisição RC {requisition.rc}
                </h2>
                <div className="flex items-center space-x-3 mt-1">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Projeto: {requisition.project}
                  </p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[requisition.status]}`}>
                    {requisition.status}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Metrics */}
          <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-900/50' : 'bg-blue-50'}`}>
                <div className="flex items-center space-x-2">
                  <Package className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total de Produtos
                  </p>
                </div>
                <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {totals.totalItems}
                </p>
              </div>

              <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-900/50' : 'bg-green-50'}`}>
                <div className="flex items-center space-x-2">
                  <TrendingUp className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Qtd Total
                  </p>
                </div>
                <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {totals.totalQuantity}
                </p>
              </div>

              <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-900/50' : 'bg-emerald-50'}`}>
                <div className="flex items-center space-x-2">
                  <TrendingUp className={`h-4 w-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Entregue
                  </p>
                </div>
                <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {totals.deliveredQuantity}
                </p>
              </div>

              <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-900/50' : 'bg-amber-50'}`}>
                <div className="flex items-center space-x-2">
                  <TrendingUp className={`h-4 w-4 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Pendente
                  </p>
                </div>
                <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {totals.pendingQuantity}
                </p>
              </div>

              <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-900/50' : 'bg-purple-50'}`}>
                <div className="flex items-center space-x-2">
                  <DollarSign className={`h-4 w-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Valor Total
                  </p>
                </div>
                <p className={`text-xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(totals.totalValue)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className={`px-6 py-3 border-b flex items-center justify-between ${
            isDarkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50/50'
          }`}>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {products.length === 0 ? 'Nenhum produto cadastrado' : `${products.length} produto(s) cadastrado(s)`}
            </p>
            <button
              onClick={handleAddProduct}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </button>
          </div>

          {/* Products Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Package className={`h-16 w-16 mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Nenhum produto vinculado
                </p>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Clique em "Adicionar Produto" para começar
                </p>
              </div>
            ) : (
              <div className="p-6">
                <PurchaseOrderItemsTable
                  items={products}
                  upcomingDeliveries={upcomingDeliveries}
                  onEdit={handleEditProduct}
                  onViewDetails={() => {}}
                  onDelete={handleDeleteProduct}
                  onUpdate={handleUpdateProduct}
                  isDarkMode={isDarkMode}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      <PurchaseOrderItemForm
        isOpen={productFormOpen}
        onClose={() => setProductFormOpen(false)}
        onSave={handleSaveProduct}
        item={selectedProduct}
        uniqueValues={getUniqueValues()}
        defaultValues={selectedProduct ? undefined : getDefaultProductData()}
      />
    </>
  );
}
