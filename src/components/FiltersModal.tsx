import React, { useState, useEffect } from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import { FilterState } from '../types';
import { REQUISITION_STATUSES } from '../utils/constants';

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  uniqueValues: {
    projects: string[];
    categories: string[];
    suppliers: string[];
  };
  isDarkMode?: boolean;
}

export function FiltersModal({ 
  isOpen, 
  onClose, 
  currentFilters, 
  onApplyFilters, 
  uniqueValues,
  isDarkMode = false 
}: FiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters);

  // Sincronizar filtros locais quando os filtros atuais mudarem
  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: FilterState = {
      rcSearch: '',
      projectSearch: '',
      statusSearch: '',
      freightFilter: 'all',
      attentionFilter: 'all'
    };
    setLocalFilters(clearedFilters);
    onApplyFilters(clearedFilters);
    onClose();
  };

  const handleChange = (field: keyof FilterState, value: any) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  // Contar filtros ativos (excluindo rcSearch que fica sempre visível)
  const activeFiltersCount = Object.entries(localFilters).filter(([key, value]) => {
    if (key === 'rcSearch' || key === 'projectSearch') return false;
    if (key === 'freightFilter' || key === 'attentionFilter') {
      return value !== 'all';
    }
    return value !== '';
  }).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode 
            ? 'border-gray-700 bg-gray-900/50' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
              isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
            }`}>
              <Filter className={`h-5 w-5 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Filtros Avançados
              </h2>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {activeFiltersCount > 0 
                  ? `${activeFiltersCount} filtro(s) ativo(s)`
                  : 'Configure os filtros para refinar sua busca'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          
          {/* Grid de Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Status */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                📊 Status da Requisição
              </label>
              <select
                value={localFilters.statusSearch}
                onChange={(e) => handleChange('statusSearch', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Todos os status</option>
                {REQUISITION_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Frete */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                🚛 Controle de Frete
              </label>
              <select
                value={localFilters.freightFilter}
                onChange={(e) => handleChange('freightFilter', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">Todos (Frete)</option>
                <option value="with">🚛 Com Frete</option>
                <option value="without">📦 Sem Frete</option>
              </select>
            </div>

          </div>

          {/* Filtro de Atenção - Largura Total */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              ⚠️ Alertas de Entrega
            </label>
            <select
              value={localFilters.attentionFilter}
              onChange={(e) => handleChange('attentionFilter', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">Todas as entregas</option>
              <option value="delayed">🚨 Entregas Atrasadas</option>
              <option value="upcoming">📅 Entregas Próximas (5 dias)</option>
              <option value="attention">⚠️ Precisam Atenção (Atrasadas + Próximas)</option>
            </select>
          </div>

          {/* Resumo dos Filtros Ativos */}
          {activeFiltersCount > 0 && (
            <div className={`p-4 rounded-lg border-l-4 ${
              isDarkMode 
                ? 'bg-blue-900/20 border-blue-500 text-blue-300' 
                : 'bg-blue-50 border-blue-500 text-blue-700'
            }`}>
              <h4 className="font-medium mb-2">Filtros Ativos:</h4>
              <div className="space-y-1 text-sm">
                {localFilters.statusSearch && (
                  <div>• Status: {localFilters.statusSearch}</div>
                )}
                {localFilters.freightFilter !== 'all' && (
                  <div>• Frete: {localFilters.freightFilter === 'with' ? 'Com Frete' : 'Sem Frete'}</div>
                )}
                {localFilters.attentionFilter !== 'all' && (
                  <div>• Atenção: {
                    localFilters.attentionFilter === 'delayed' ? 'Atrasadas' :
                    localFilters.attentionFilter === 'upcoming' ? 'Próximas' :
                    'Precisam Atenção'
                  }</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-between items-center ${
          isDarkMode 
            ? 'bg-gray-900/50 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <button
            onClick={handleClear}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 ${
              isDarkMode
                ? 'text-red-400 bg-gray-800 border-red-600 hover:bg-red-900/20'
                : 'text-red-700 bg-white border-red-300 hover:bg-red-50'
            }`}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar Todos
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className={`px-6 py-2 text-sm font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                isDarkMode
                  ? 'text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700'
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm hover:shadow-md"
            >
              Aplicar Filtros
              {activeFiltersCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-500 rounded-full text-xs">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}