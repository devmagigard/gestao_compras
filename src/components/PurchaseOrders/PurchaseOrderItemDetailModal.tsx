import React from 'react';
import { X, Package, Calendar, DollarSign, TrendingUp, FileText } from 'lucide-react';
import { PurchaseOrderItem } from '../../types';
import { PO_STATUS_COLORS, CURRENCY_SYMBOLS } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

interface PurchaseOrderItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PurchaseOrderItem | null;
}

export function PurchaseOrderItemDetailModal({
  isOpen,
  onClose,
  item
}: PurchaseOrderItemDetailModalProps) {
  if (!isOpen || !item) return null;

  const deliveryPercentage = item.quantidade > 0
    ? Math.round((item.quantidadeEntregue / item.quantidade) * 100)
    : 0;

  const remainingQuantity = item.quantidade - item.quantidadeEntregue;
  const totalValue = item.valorUnitario * item.quantidade;
  const deliveredValue = item.valorUnitario * item.quantidadeEntregue;
  const remainingValue = item.valorUnitario * remainingQuantity;

  const formatCurrencyValue = (value: number) => {
    const symbol = CURRENCY_SYMBOLS[item.moeda as keyof typeof CURRENCY_SYMBOLS] || item.moeda;
    return `${symbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Detalhes do Produto
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              PO: {item.numeroPo} • Código: {item.codItem}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${PO_STATUS_COLORS[item.status]} border border-current border-opacity-20`}>
              {item.status}
            </span>
            {item.dataEntrega && (
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-1" />
                Entrega: {formatDate(item.dataEntrega)}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {item.quantidade > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progresso de Entrega</span>
                <span className="text-sm font-bold text-gray-900">{deliveryPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    deliveryPercentage === 100
                      ? 'bg-green-500'
                      : deliveryPercentage > 0
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${deliveryPercentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span>Entregue: {item.quantidadeEntregue}</span>
                <span>Total: {item.quantidade}</span>
              </div>
            </div>
          )}

          {/* Identificação */}
          <div>
            <div className="flex items-center mb-3">
              <Package className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Identificação</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Número PO</p>
                <p className="text-sm font-semibold text-gray-900">{item.numeroPo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Código do Item</p>
                <p className="text-sm font-semibold text-gray-900">{item.codItem}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Descrição</p>
                <p className="text-sm font-semibold text-gray-900">{item.descricaoItem}</p>
              </div>
              {item.ncm && (
                <div>
                  <p className="text-sm text-gray-600">NCM</p>
                  <p className="text-sm font-semibold text-gray-900">{item.ncm}</p>
                </div>
              )}
              {item.garantia && (
                <div>
                  <p className="text-sm text-gray-600">Garantia</p>
                  <p className="text-sm font-semibold text-gray-900">{item.garantia}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quantidades */}
          <div>
            <div className="flex items-center mb-3">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Quantidades</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">Quantidade Total</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{item.quantidade}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-700 font-medium">Já Entregue</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{item.quantidadeEntregue}</p>
              </div>
              <div className={`rounded-lg p-4 border ${
                remainingQuantity > 0
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <p className={`text-sm font-medium ${
                  remainingQuantity > 0 ? 'text-amber-700' : 'text-gray-700'
                }`}>Falta Entregar</p>
                <p className={`text-2xl font-bold mt-1 ${
                  remainingQuantity > 0 ? 'text-amber-900' : 'text-gray-900'
                }`}>{remainingQuantity}</p>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div>
            <div className="flex items-center mb-3">
              <DollarSign className="h-5 w-5 text-emerald-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Valores Financeiros</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Valor Unitário</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrencyValue(item.valorUnitario)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Moeda</p>
                  <p className="text-lg font-semibold text-gray-900">{item.moeda}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrencyValue(totalValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Já Entregue</p>
                  <p className="text-lg font-bold text-green-700">{formatCurrencyValue(deliveredValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pendente</p>
                  <p className={`text-lg font-bold ${remainingValue > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
                    {formatCurrencyValue(remainingValue)}
                  </p>
                </div>
              </div>
              {item.condicoesPagamento && (
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm text-gray-600">Condições de Pagamento</p>
                  <p className="text-sm font-medium text-gray-900">{item.condicoesPagamento}</p>
                </div>
              )}
            </div>
          </div>

          {/* Datas */}
          <div>
            <div className="flex items-center mb-3">
              <Calendar className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Datas</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {item.dataPo && (
                <div>
                  <p className="text-sm text-gray-600">Data do PO</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(item.dataPo)}</p>
                </div>
              )}
              {item.ultimaAtualizacao && (
                <div>
                  <p className="text-sm text-gray-600">Última Atualização</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(item.ultimaAtualizacao)}</p>
                </div>
              )}
              {item.dataEntrega && (
                <div>
                  <p className="text-sm text-gray-600">Data de Entrega</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(item.dataEntrega)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          {item.observacoes && (
            <div>
              <div className="flex items-center mb-3">
                <FileText className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Observações</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.observacoes}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-500">
              <div>
                <span className="font-medium">Criado em:</span>{' '}
                {new Date(item.createdAt).toLocaleString('pt-BR')}
              </div>
              <div>
                <span className="font-medium">Atualizado em:</span>{' '}
                {new Date(item.updatedAt).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
