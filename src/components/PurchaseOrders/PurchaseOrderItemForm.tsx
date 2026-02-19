import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PurchaseOrderItem, PurchaseOrderStatus, Currency } from '../../types';
import { PURCHASE_ORDER_STATUSES, CURRENCIES } from '../../utils/constants';
import { DateInput } from '../UI/DateInput';

interface PurchaseOrderItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<PurchaseOrderItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  item?: PurchaseOrderItem | null;
  uniqueValues: {
    purchaseOrders: string[];
    itemCodes: string[];
  };
  defaultValues?: {
    numeroPo?: string;
    requisitionId?: string;
  };
}

export function PurchaseOrderItemForm({
  isOpen,
  onClose,
  onSave,
  item,
  uniqueValues,
  defaultValues
}: PurchaseOrderItemFormProps) {
  const [formData, setFormData] = useState<Omit<PurchaseOrderItem, 'id' | 'createdAt' | 'updatedAt'>>({
    numeroPo: '',
    ultimaAtualizacao: new Date().toISOString().split('T')[0],
    dataPo: '',
    codItem: '',
    descricaoItem: '',
    ncm: '',
    garantia: '',
    quantidade: '' as any,
    quantidadeEntregue: '' as any,
    valorUnitario: '' as any,
    moeda: 'BRL' as Currency,
    condicoesPagamento: '',
    dataEntrega: '',
    status: 'Pedido' as PurchaseOrderStatus,
    observacoes: '',
    requisitionId: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        numeroPo: item.numeroPo,
        ultimaAtualizacao: item.ultimaAtualizacao || new Date().toISOString().split('T')[0],
        dataPo: item.dataPo,
        codItem: item.codItem,
        descricaoItem: item.descricaoItem,
        ncm: item.ncm,
        garantia: item.garantia,
        quantidade: item.quantidade,
        quantidadeEntregue: item.quantidadeEntregue,
        valorUnitario: item.valorUnitario,
        moeda: item.moeda,
        condicoesPagamento: item.condicoesPagamento,
        dataEntrega: item.dataEntrega,
        status: item.status,
        observacoes: item.observacoes,
        requisitionId: item.requisitionId
      });
    } else {
      setFormData({
        numeroPo: defaultValues?.numeroPo || '',
        ultimaAtualizacao: new Date().toISOString().split('T')[0],
        dataPo: '',
        codItem: '',
        descricaoItem: '',
        ncm: '',
        garantia: '',
        quantidade: '' as any,
        quantidadeEntregue: '' as any,
        valorUnitario: '' as any,
        moeda: 'BRL',
        condicoesPagamento: '',
        dataEntrega: '',
        status: 'Pedido',
        observacoes: '',
        requisitionId: defaultValues?.requisitionId || ''
      });
    }
  }, [item, isOpen, defaultValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.numeroPo.trim()) {
      alert('Número PO é obrigatório');
      return;
    }
    
    if (!formData.descricaoItem.trim()) {
      alert('Descrição do item é obrigatória');
      return;
    }
    
    onSave(formData);
    onClose();
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    // Para campos numéricos, permitir string vazia
    if (field === 'quantidade' || field === 'quantidadeEntregue' || field === 'valorUnitario') {
      if (value === '') {
        setFormData(prev => ({ ...prev, [field]: '' as any }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {item ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Identificação */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Identificação do Pedido</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número PO *
                </label>
                <input
                  type="text"
                  required
                  value={formData.numeroPo}
                  onChange={(e) => handleChange('numeroPo', e.target.value)}
                  list="po-numbers"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <datalist id="po-numbers">
                  {uniqueValues.purchaseOrders.map(po => (
                    <option key={po} value={po} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data PO
                </label>
                <DateInput
                  value={formData.dataPo}
                  onChange={(e) => handleChange('dataPo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código do Item
                </label>
                <input
                  type="text"
                  value={formData.codItem}
                  onChange={(e) => handleChange('codItem', e.target.value)}
                  list="item-codes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <datalist id="item-codes">
                  {uniqueValues.itemCodes.map(code => (
                    <option key={code} value={code} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NCM
                </label>
                <input
                  type="text"
                  value={formData.ncm}
                  onChange={(e) => handleChange('ncm', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição do Item *
                </label>
                <textarea
                  required
                  value={formData.descricaoItem}
                  onChange={(e) => handleChange('descricaoItem', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PURCHASE_ORDER_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Garantia
                </label>
                <input
                  type="text"
                  value={formData.garantia}
                  onChange={(e) => handleChange('garantia', e.target.value)}
                  placeholder="Ex: 12 meses"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Quantidades */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quantidades</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade Total
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantidade}
                  onChange={(e) => handleChange('quantidade', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade Entregue
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantidadeEntregue}
                  onChange={(e) => handleChange('quantidadeEntregue', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Falta Entregar
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 font-medium">
                  {((parseFloat(formData.quantidade as any) || 0) - (parseFloat(formData.quantidadeEntregue as any) || 0)).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Valores e Pagamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Unitário
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valorUnitario}
                  onChange={(e) => handleChange('valorUnitario', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moeda
                </label>
                <select
                  value={formData.moeda}
                  onChange={(e) => handleChange('moeda', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condições de Pagamento
                </label>
                <input
                  type="text"
                  value={formData.condicoesPagamento}
                  onChange={(e) => handleChange('condicoesPagamento', e.target.value)}
                  placeholder="Ex: 30/60/90 dias"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Valor Total:</strong> {formData.moeda} {((parseFloat(formData.valorUnitario as any) || 0) * (parseFloat(formData.quantidade as any) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Prazos */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Prazos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Última Atualização
                </label>
                <DateInput
                  value={formData.ultimaAtualizacao}
                  onChange={(e) => handleChange('ultimaAtualizacao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Entrega
                </label>
                <DateInput
                  value={formData.dataEntrega}
                  onChange={(e) => handleChange('dataEntrega', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Observações adicionais sobre o produto..."
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.observacoes.length}/2000 caracteres
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {item ? 'Salvar Alterações' : 'Criar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
