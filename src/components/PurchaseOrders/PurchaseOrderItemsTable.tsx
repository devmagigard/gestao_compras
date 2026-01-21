import React, { useState } from 'react';
import { PurchaseOrderItem } from '../../types';
import { Edit, Trash2, Package, Eye, AlertCircle, CalendarClock } from 'lucide-react';
import { PO_STATUS_COLORS, PURCHASE_ORDER_STATUSES, CURRENCIES, CURRENCY_SYMBOLS } from '../../utils/constants';
import { EditableCell } from '../Requisitions/EditableCell';
import { Tooltip } from '../UI/Tooltip';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { createLocalDate } from '../../utils/dateHelpers';

interface PurchaseOrderItemsTableProps {
  items: PurchaseOrderItem[];
  upcomingDeliveries: PurchaseOrderItem[];
  onEdit: (item: PurchaseOrderItem) => void;
  onViewDetails: (item: PurchaseOrderItem) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: keyof PurchaseOrderItem, value: any) => void;
  isDarkMode?: boolean;
}

export function PurchaseOrderItemsTable({
  items,
  upcomingDeliveries,
  onEdit,
  onViewDetails,
  onDelete,
  onUpdate,
  isDarkMode = false
}: PurchaseOrderItemsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<keyof PurchaseOrderItem>('numeroPo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedItems = [...items].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortField === 'numeroPo') {
      const numA = parseInt((String(aValue) || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((String(bValue) || '').replace(/\D/g, ''), 10) || 0;
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof PurchaseOrderItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCellUpdate = (id: string, field: keyof PurchaseOrderItem, value: any) => {
    onUpdate(id, field, value);
  };

  const isUpcomingDelivery = (item: PurchaseOrderItem) => {
    return upcomingDeliveries.some(upcoming => upcoming.id === item.id);
  };

  const isDelayedDelivery = (item: PurchaseOrderItem) => {
    if (!item.dataEntrega) return false;
    if (item.status === 'Entregue' || item.status === 'Cancelado') return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveryDate = createLocalDate(item.dataEntrega);
    deliveryDate.setHours(0, 0, 0, 0);

    return deliveryDate < today;
  };

  const getDaysUntilDelivery = (item: PurchaseOrderItem) => {
    if (!item.dataEntrega) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveryDate = createLocalDate(item.dataEntrega);
    deliveryDate.setHours(0, 0, 0, 0);

    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const calculateRemainingQuantity = (item: PurchaseOrderItem) => {
    return item.quantidade - item.quantidadeEntregue;
  };

  const formatCurrencyValue = (value: number, currency: string) => {
    const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency;
    return `${symbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (items.length === 0) {
    return (
      <div className={`rounded-lg shadow-sm border p-12 text-center ${
        isDarkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <Package className={`h-16 w-16 mx-auto mb-4 ${
          isDarkMode ? 'text-gray-600' : 'text-gray-300'
        }`} />
        <h3 className={`text-lg font-medium mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Nenhum produto encontrado
        </h3>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
          Comece criando um novo produto ou ajuste os filtros de busca.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-sm border overflow-hidden w-full ${
      isDarkMode
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-100'
    }`}>
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y ${
          isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
        }`}>
          <thead className={isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50/50'}>
            <tr>
              <th
                onClick={() => handleSort('numeroPo')}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Número PO
              </th>
              <th
                onClick={() => handleSort('status')}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Status
              </th>
              <th
                onClick={() => handleSort('codItem')}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cód. Item
              </th>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Descrição
              </th>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                NCM
              </th>
              <th
                onClick={() => handleSort('quantidade')}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors hidden md:table-cell ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Qtd
              </th>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Qtd Entregue
              </th>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Falta Entregar
              </th>
              <th
                onClick={() => handleSort('valorUnitario')}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors hidden lg:table-cell ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Valor Unit.
              </th>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden xl:table-cell ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Moeda
              </th>
              <th
                onClick={() => handleSort('dataEntrega')}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors hidden xl:table-cell ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Data Entrega
              </th>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden xl:table-cell ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Garantia
              </th>
              <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${
            isDarkMode
              ? 'bg-gray-800 divide-gray-700'
              : 'bg-white divide-gray-100'
          }`}>
            {paginatedItems.map((item) => (
              <tr
                key={item.id}
                className={`transition-all duration-200 h-14 ${
                  isDelayedDelivery(item)
                    ? isDarkMode
                      ? 'bg-red-900/20 hover:bg-red-900/30 border-l-4 border-red-500'
                      : 'bg-red-50/50 hover:bg-red-50/80 border-l-4 border-red-500'
                    : isUpcomingDelivery(item)
                    ? isDarkMode
                      ? 'bg-amber-900/20 hover:bg-amber-900/30 border-l-4 border-amber-500'
                      : 'bg-amber-50/50 hover:bg-amber-50/80 border-l-4 border-amber-500'
                    : isDarkMode
                    ? 'hover:bg-gray-700/50'
                    : 'hover:bg-blue-50/30'
                }`}
              >
                <td className="px-4 py-3 whitespace-nowrap align-middle">
                  <div className="flex items-center space-x-2">
                    <EditableCell
                      value={item.numeroPo}
                      onSave={(value) => handleCellUpdate(item.id, 'numeroPo', value)}
                      className={`text-sm font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                    {(isDelayedDelivery(item) || isUpcomingDelivery(item)) && (
                      <div className="flex items-center space-x-1">
                        {isDelayedDelivery(item) && (
                          <div className="flex items-center text-red-600" title={`Entrega atrasada há ${Math.abs(getDaysUntilDelivery(item) || 0)} dias`}>
                            <AlertCircle className="h-4 w-4" />
                          </div>
                        )}
                        {isUpcomingDelivery(item) && !isDelayedDelivery(item) && (
                          <div className="flex items-center text-amber-600" title={`Entrega em ${getDaysUntilDelivery(item)} dias`}>
                            <CalendarClock className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap align-middle">
                  <EditableCell
                    value={item.status}
                    onSave={(value) => handleCellUpdate(item.id, 'status', value)}
                    type="select"
                    options={PURCHASE_ORDER_STATUSES}
                    displayValue={
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${PO_STATUS_COLORS[item.status]} border border-current border-opacity-20`}>
                        {item.status}
                      </span>
                    }
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap align-middle">
                  <EditableCell
                    value={item.codItem}
                    onSave={(value) => handleCellUpdate(item.id, 'codItem', value)}
                    className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 max-w-xs align-middle">
                  <Tooltip content={item.descricaoItem} maxWidth="max-w-md">
                    <div className="cursor-help">
                      <EditableCell
                        value={item.descricaoItem}
                        onSave={(value) => handleCellUpdate(item.id, 'descricaoItem', value)}
                        className={`text-sm line-clamp-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      />
                    </div>
                  </Tooltip>
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell align-middle">
                  <EditableCell
                    value={item.ncm || ''}
                    onSave={(value) => handleCellUpdate(item.id, 'ncm', value)}
                    className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell align-middle">
                  <EditableCell
                    value={item.quantidade}
                    onSave={(value) => handleCellUpdate(item.id, 'quantidade', value)}
                    type="number"
                    className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell align-middle">
                  <EditableCell
                    value={item.quantidadeEntregue}
                    onSave={(value) => handleCellUpdate(item.id, 'quantidadeEntregue', value)}
                    type="number"
                    className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </td>
                <td className={`px-4 py-3 whitespace-nowrap hidden lg:table-cell align-middle ${
                  calculateRemainingQuantity(item) > 0 ? 'font-bold text-amber-600' : 'text-green-600'
                }`}>
                  {calculateRemainingQuantity(item)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell align-middle">
                  <EditableCell
                    value={item.valorUnitario}
                    onSave={(value) => handleCellUpdate(item.id, 'valorUnitario', value)}
                    type="number"
                    displayValue={formatCurrencyValue(item.valorUnitario, item.moeda)}
                    className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell align-middle">
                  <EditableCell
                    value={item.moeda}
                    onSave={(value) => handleCellUpdate(item.id, 'moeda', value)}
                    type="select"
                    options={CURRENCIES}
                    className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell align-middle">
                  <EditableCell
                    value={item.dataEntrega || ''}
                    onSave={(value) => handleCellUpdate(item.id, 'dataEntrega', value)}
                    type="date"
                    className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    } ${
                      isDelayedDelivery(item)
                        ? 'font-bold text-red-600'
                        : isUpcomingDelivery(item)
                        ? 'font-bold text-amber-600'
                        : ''
                    }`}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell align-middle">
                  <EditableCell
                    value={item.garantia || ''}
                    onSave={(value) => handleCellUpdate(item.id, 'garantia', value)}
                    className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium align-middle">
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      onClick={() => onViewDetails(item)}
                      className="text-indigo-600 hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Ver Detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(item)}
                      className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Editar Completo"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir este produto?')) {
                          onDelete(item.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={`px-4 py-3 border-t sm:px-6 ${
          isDarkMode
            ? 'bg-gray-900/30 border-gray-700'
            : 'bg-gray-50/30 border-gray-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg disabled:opacity-50 transition-colors ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg disabled:opacity-50 transition-colors ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Mostrando{' '}
                  <span className="font-medium">{startIndex + 1}</span> até{' '}
                  <span className="font-medium">
                    {Math.min(startIndex + itemsPerPage, items.length)}
                  </span>{' '}
                  de <span className="font-medium">{items.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-3 py-2 rounded-l-lg border text-sm font-medium disabled:opacity-50 transition-colors ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700'
                        : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Anterior
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                          currentPage === page
                            ? isDarkMode
                              ? 'z-10 bg-blue-900 border-blue-500 text-blue-400'
                              : 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-3 py-2 rounded-r-lg border text-sm font-medium disabled:opacity-50 transition-colors ${
                      isDarkMode
                        ? 'border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700'
                        : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Próximo
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
