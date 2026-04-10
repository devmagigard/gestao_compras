import React from 'react';
import { Package, TrendingUp, CheckCircle, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import { PurchaseOrderMetrics } from '../../types';
import { CURRENCY_SYMBOLS } from '../../utils/constants';

type MetricFilterKey = 'partiallyDelivered' | 'upcoming' | 'delayed' | null;

interface ProductMetricsCardsProps {
  metrics: PurchaseOrderMetrics;
  isDarkMode?: boolean;
  onCardClick?: (filterKey: MetricFilterKey) => void;
  activeFilter?: MetricFilterKey;
}

export function ProductMetricsCards({ metrics, isDarkMode = false, onCardClick, activeFilter }: ProductMetricsCardsProps) {
  const formatCurrency = (value: number) => {
    const numericValue = typeof value === 'number' && !isNaN(value) && isFinite(value) ? value : 0;
    return `R$ ${numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const cards = [
    {
      title: 'Total de Produtos',
      value: metrics?.totalItems || 0,
      icon: Package,
      bgColor: isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      filterKey: null as MetricFilterKey
    },
    {
      title: 'Aguardando Entrega',
      value: metrics?.pendingDelivery || 0,
      icon: Clock,
      bgColor: isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
      filterKey: null as MetricFilterKey
    },
    {
      title: 'Parcialmente Entregue',
      value: metrics?.partiallyDelivered || 0,
      icon: TrendingUp,
      bgColor: isDarkMode ? 'bg-orange-900/20' : 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      filterKey: 'partiallyDelivered' as MetricFilterKey
    },
    {
      title: 'Entregues',
      value: metrics?.completed || 0,
      icon: CheckCircle,
      bgColor: isDarkMode ? 'bg-green-900/20' : 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      filterKey: null as MetricFilterKey
    },
    {
      title: 'Valor Total',
      value: formatCurrency(metrics?.totalValue || 0),
      icon: DollarSign,
      bgColor: isDarkMode ? 'bg-emerald-900/20' : 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      isLarge: true,
      filterKey: null as MetricFilterKey
    },
    {
      title: 'Entregas Atrasadas',
      value: metrics?.delayedDeliveries || 0,
      icon: AlertTriangle,
      bgColor: isDarkMode ? 'bg-red-900/20' : 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      alert: (metrics?.delayedDeliveries || 0) > 0,
      filterKey: 'delayed' as MetricFilterKey
    },
    {
      title: 'Entregas Próximas',
      value: metrics?.upcomingDeliveries || 0,
      subtitle: 'Próximos 5 dias',
      icon: Clock,
      bgColor: isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      filterKey: 'upcoming' as MetricFilterKey
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const isClickable = card.filterKey !== null && onCardClick;
        const isActive = card.filterKey !== null && activeFilter === card.filterKey;

        return (
          <div
            key={index}
            onClick={() => isClickable && onCardClick(isActive ? null : card.filterKey)}
            className={`${card.bgColor} border ${card.borderColor} rounded-xl p-5 transition-all duration-200 hover:shadow-md ${
              card.alert && !isActive ? 'ring-2 ring-red-400 animate-pulse' : ''
            } ${isActive ? 'ring-2 ring-offset-1 ring-current shadow-md scale-[1.02]' : ''} ${
              isClickable ? 'cursor-pointer hover:scale-[1.02] select-none' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              {isActive ? (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'
                } border`}>
                  Ativo
                </span>
              ) : card.alert ? (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                  Atenção
                </span>
              ) : null}
            </div>
            <h3 className={`text-sm font-medium mb-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {card.title}
            </h3>
            <div className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            } ${card.isLarge ? 'text-xl' : ''}`}>
              {typeof card.value === 'string' ? card.value : (card.value || 0).toLocaleString('pt-BR')}
            </div>
            {card.subtitle && (
              <p className={`text-xs mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {card.subtitle}
              </p>
            )}
            {isClickable && (
              <p className={`text-xs mt-2 font-medium ${
                isActive
                  ? isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-400'
              }`}>
                {isActive ? 'Clique para limpar filtro' : 'Clique para filtrar'}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
