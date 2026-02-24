import React, { useState, useEffect } from 'react';
import { Requisition } from '../../types';
import { Edit, Trash2, Package, User, Calendar, DollarSign, Eye, AlertCircle, CalendarClock, ShoppingCart } from 'lucide-react';
import { STATUS_COLORS, CRITICALITY_COLORS, REQUISITION_STATUSES, CRITICALITY_LEVELS } from '../../utils/constants';
import { EditableCell } from './EditableCell';
import { Tooltip } from '../UI/Tooltip';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { createLocalDate } from '../../utils/dateHelpers';
import { supabase } from '../../lib/supabase';

interface RequisitionsTableProps {
  requisitions: Requisition[];
  upcomingDeliveries: Requisition[];
  onEdit: (requisition: Requisition) => void;
  onViewDetails: (requisition: Requisition) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: keyof Requisition, value: any) => void;
  onViewProducts?: (requisition: Requisition) => void;
  isDarkMode?: boolean;
}

export function RequisitionsTable({
  requisitions,
  upcomingDeliveries,
  onEdit,
  onViewDetails,
  onDelete,
  onUpdate,
  onViewProducts,
  isDarkMode = false
}: RequisitionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<keyof Requisition>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadProductCounts();
  }, [requisitions]);

  const loadProductCounts = async () => {
    try {
      const requisitionIds = requisitions.map(r => r.id);
      if (requisitionIds.length === 0) return;

      const counts: Record<string, number> = {};
      
      // Process in batches to avoid URL length limits
      const batchSize = 50;
      for (let i = 0; i < requisitionIds.length; i += batchSize) {
        const batch = requisitionIds.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('purchase_order_items')
          .select('requisition_id')
          .in('requisition_id', batch);

        if (error) throw error;

        data?.forEach((item: any) => {
          if (item.requisition_id) {
            counts[item.requisition_id] = (counts[item.requisition_id] || 0) + 1;
          }
        });
      }

      setProductCounts(counts);
    } catch (err) {
      console.error('Erro ao carregar contagem de produtos:', err);
    }
  };

  const sortedRequisitions = [...requisitions].sort((a, b) => {
    // Ordenação especial para RC (numérica)
    if (sortField === 'rc') {
      const extractNumber = (rc: string) => {
        const match = rc.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      
      const numA = extractNumber(a.rc);
      const numB = extractNumber(b.rc);
      
      return sortDirection === 'desc' ? numB - numA : numA - numB;
    }
    
    // Ordenação padrão para outros campos
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedRequisitions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequisitions = sortedRequisitions.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof Requisition) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCellUpdate = (id: string, field: keyof Requisition, value: any) => {
    onUpdate(id, field, value);
  };

  // Função para verificar se uma requisição tem entrega próxima
  const isUpcomingDelivery = (requisition: Requisition) => {
    return upcomingDeliveries.some(upcoming => upcoming.id === requisition.id);
  };

  // Função para verificar se uma requisição está atrasada
  const isDelayedDelivery = (requisition: Requisition) => {
    if (!requisition.deliveryForecast) return false;
    if (requisition.status === 'Concluído' || requisition.status === 'Entregue') return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveryDate = createLocalDate(requisition.deliveryForecast);
    deliveryDate.setHours(0, 0, 0, 0);
    
    return deliveryDate < today;
  };

  // Função para calcular dias até a entrega
  const getDaysUntilDelivery = (requisition: Requisition) => {
    if (!requisition.deliveryForecast) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveryDate = createLocalDate(requisition.deliveryForecast);
    deliveryDate.setHours(0, 0, 0, 0);
    
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  if (requisitions.length === 0) {
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
          Nenhuma requisição encontrada
        </h3>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
          Comece criando uma nova requisição ou ajuste os filtros de busca.
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
                onClick={() => handleSort('rc')}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:bg-gray-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                RC
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
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Item
              </th>
              <th
                onClick={() => handleSort('project')}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors hidden md:table-cell ${
                  isDarkMode 
                    ? 'text-gray-400 hover:bg-gray-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Projeto
              </th>
              <th
                onClick={() => handleSort('supplier')}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors hidden lg:table-cell ${
                  isDarkMode 
                    ? 'text-gray-400 hover:bg-gray-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Fornecedor
              </th>
              <th
                onClick={() => handleSort('dismemberedRc')}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors hidden xl:table-cell ${
                  isDarkMode 
                    ? 'text-gray-400 hover:bg-gray-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                RC Desmembrado
              </th>
              <th
                onClick={() => handleSort('criticality')}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors hidden xl:table-cell ${
                  isDarkMode 
                    ? 'text-gray-400 hover:bg-gray-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Criticidade
              </th>
              <th
                onClick={() => handleSort('invoiceValue')}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors hidden lg:table-cell ${
                  isDarkMode 
                    ? 'text-gray-400 hover:bg-gray-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Valor
              </th>
              <th
                onClick={() => handleSort('deliveryForecast')}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors hidden xl:table-cell ${
                  isDarkMode 
                    ? 'text-gray-400 hover:bg-gray-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Previsão Entrega
              </th>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Categoria
              </th>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden xl:table-cell ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Observações
              </th>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden xl:table-cell ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Frete
              </th>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden xl:table-cell ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Valor Frete
              </th>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden xl:table-cell ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Status Frete
              </th>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden xl:table-cell ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Transportadora
              </th>
              <th className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Produtos
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
            {paginatedRequisitions.map((requisition) => (
              <tr 
                key={requisition.id} 
                className={`transition-all duration-200 h-14 ${
                  isDelayedDelivery(requisition)
                    ? isDarkMode 
                      ? 'bg-red-900/20 hover:bg-red-900/30 border-l-4 border-red-500' 
                      : 'bg-red-50/50 hover:bg-red-50/80 border-l-4 border-red-500'
                    : isUpcomingDelivery(requisition)
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
                    value={requisition.rc}
                    onSave={(value) => handleCellUpdate(requisition.id, 'rc', value)}
                    className={`text-sm font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                    {(isDelayedDelivery(requisition) || isUpcomingDelivery(requisition)) && (
                      <div className="flex items-center space-x-1">
                        {isDelayedDelivery(requisition) && (
                          <div className="flex items-center text-red-600" title={`Entrega atrasada há ${Math.abs(getDaysUntilDelivery(requisition) || 0)} dias`}>
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs font-medium ml-1">
                              {Math.abs(getDaysUntilDelivery(requisition) || 0)}d
                            </span>
                          </div>
                        )}
                        {isUpcomingDelivery(requisition) && !isDelayedDelivery(requisition) && (
                          <div className="flex items-center text-amber-600" title={`Entrega em ${getDaysUntilDelivery(requisition)} dias`}>
                            <CalendarClock className="h-4 w-4" />
                            <span className="text-xs font-medium ml-1">
                              {getDaysUntilDelivery(requisition)}d
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={`text-xs md:hidden mt-0.5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {requisition.project}
                  </div>
                  {(isDelayedDelivery(requisition) || isUpcomingDelivery(requisition)) && (
                    <div className="text-xs mt-1 font-medium">
                      {isDelayedDelivery(requisition) && (
                        <span className="text-red-600">
                          ⚠️ Atrasado {Math.abs(getDaysUntilDelivery(requisition) || 0)} dias
                        </span>
                      )}
                      {isUpcomingDelivery(requisition) && !isDelayedDelivery(requisition) && (
                        <span className="text-amber-600">
                          📅 Entrega em {getDaysUntilDelivery(requisition)} dias
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap align-middle">
                  <EditableCell
                    value={requisition.status}
                    onSave={(value) => handleCellUpdate(requisition.id, 'status', value)}
                    type="select"
                    options={REQUISITION_STATUSES}
                    displayValue={
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[requisition.status]} border border-current border-opacity-20`}>
                        {requisition.status}
                      </span>
                    }
                  />
                </td>
                <td className="px-4 py-3 max-w-xs align-middle">
                  <Tooltip content={requisition.item} maxWidth="max-w-md">
                    <div className="cursor-help">
                      <EditableCell
                        value={requisition.item}
                        onSave={(value) => handleCellUpdate(requisition.id, 'item', value)}
                        className={`text-sm line-clamp-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      />
                    </div>
                  </Tooltip>
                  <div className={`text-xs lg:hidden mt-1 space-x-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {requisition.supplier && (
                      <span className="inline-flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {requisition.supplier}
                      </span>
                    )}
                    {requisition.invoiceValue > 0 && (
                      <span className="inline-flex items-center">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {formatCurrency(requisition.invoiceValue)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell align-middle">
                  <EditableCell
                    value={requisition.project}
                    onSave={(value) => handleCellUpdate(requisition.id, 'project', value)}
                    className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell align-middle">
                  <EditableCell
                    value={requisition.supplier || ''}
                    onSave={(value) => handleCellUpdate(requisition.id, 'supplier', value)}
                    className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell align-middle">
                  <EditableCell
                    value={requisition.dismemberedRc || ''}
                    onSave={(value) => handleCellUpdate(requisition.id, 'dismemberedRc', value)}
                    className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell align-middle">
                  <EditableCell
                    value={requisition.criticality}
                    onSave={(value) => handleCellUpdate(requisition.id, 'criticality', value)}
                    type="select"
                    options={CRITICALITY_LEVELS}
                    displayValue={
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${CRITICALITY_COLORS[requisition.criticality]} border border-current border-opacity-20`}>
                        {requisition.criticality}
                      </span>
                    }
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell align-middle">
                  <EditableCell
                    value={requisition.invoiceValue}
                    onSave={(value) => handleCellUpdate(requisition.id, 'invoiceValue', value)}
                    type="number"
                    displayValue={requisition.invoiceValue > 0 ? formatCurrency(requisition.invoiceValue) : '-'}
                    className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell align-middle">
                  <EditableCell
                    value={requisition.deliveryForecast || ''}
                    onSave={(value) => handleCellUpdate(requisition.id, 'deliveryForecast', value)}
                    type="date"
                    className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    } ${
                      isDelayedDelivery(requisition) 
                        ? 'font-bold text-red-600' 
                        : isUpcomingDelivery(requisition) 
                        ? 'font-bold text-amber-600' 
                        : ''
                    }`}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell align-middle">
                  <EditableCell
                    value={requisition.category || ''}
                    onSave={(value) => handleCellUpdate(requisition.id, 'category', value)}
                    className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 max-w-xs hidden xl:table-cell align-middle">
                  <Tooltip content={requisition.observations || ''} maxWidth="max-w-lg">
                    <div className="cursor-help">
                      <EditableCell
                        value={requisition.observations || ''}
                        onSave={(value) => handleCellUpdate(requisition.id, 'observations', value)}
                        className={`text-sm max-w-xs truncate ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      />
                    </div>
                  </Tooltip>
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell align-middle">
                  <EditableCell
                    value={requisition.freight}
                    onSave={(value) => handleCellUpdate(requisition.id, 'freight', value)}
                    type="checkbox"
                    className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell align-middle">
                  <EditableCell
                    value={requisition.freightValue}
                    onSave={(value) => handleCellUpdate(requisition.id, 'freightValue', value)}
                    type="number"
                    displayValue={requisition.freightValue > 0 ? formatCurrency(requisition.freightValue) : '-'}
                    className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell align-middle">
                  <EditableCell
                    value={requisition.freightStatus || ''}
                    onSave={(value) => handleCellUpdate(requisition.id, 'freightStatus', value)}
                    className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell align-middle">
                  <EditableCell
                    value={requisition.freightCompany || ''}
                    onSave={(value) => handleCellUpdate(requisition.id, 'freightCompany', value)}
                    className={`text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center align-middle">
                  <button
                    onClick={() => onViewProducts && onViewProducts(requisition)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      productCounts[requisition.id] > 0
                        ? isDarkMode
                          ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border border-blue-700'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                        : isDarkMode
                        ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 border border-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                    }`}
                    title="Ver produtos desta requisição"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1.5" />
                    <span className="font-bold">{productCounts[requisition.id] || 0}</span>
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium align-middle">
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      onClick={() => onViewDetails(requisition)}
                      className="text-indigo-600 hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Ver Detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(requisition)}
                      className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Editar Completo"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta requisição?')) {
                          onDelete(requisition.id);
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

      {/* Pagination */}
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
                    {Math.min(startIndex + itemsPerPage, requisitions.length)}
                  </span>{' '}
                  de <span className="font-medium">{requisitions.length}</span> resultados
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