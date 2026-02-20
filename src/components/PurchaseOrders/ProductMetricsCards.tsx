import React from 'react';
import { Package, TrendingUp, CheckCircle, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import { PurchaseOrderMetrics } from '../../types';
import { CURRENCY_SYMBOLS } from '../../utils/constants';

interface ProductMetricsCardsProps {
  metrics: PurchaseOrderMetrics;
  isDarkMode?: boolean;
}

export function ProductMetricsCards({ metrics, isDarkMode = false }: ProductMetricsCardsProps) {
  const formatCurrency = (value: number) => {
    // Garantir que value é um número válido
    const numericValue = typeof value === 'number' && !isNaN(value) && isFinite(value) ? value : 0;
    return `R$ ${numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Debug: Log das métricas recebidas
  console.log('ProductMetricsCards - Métricas recebidas:', metrics);

  const cards = [
    {
      title: 'Total de Produtos',
      value: metrics?.totalItems || 0,
      icon: Package,
      color: 'blue',
      bgColor: isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Aguardando Entrega',
      value: metrics?.pendingDelivery || 0,
      icon: Clock,
      color: 'yellow',
      bgColor: isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    {
      title: 'Parcialmente Entregue',
      value: metrics?.partiallyDelivered || 0,
      icon: TrendingUp,
      color: 'orange',
      bgColor: isDarkMode ? 'bg-orange-900/20' : 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Entregues',
      value: metrics?.completed || 0,
      icon: CheckCircle,
      color: 'green',
      bgColor: isDarkMode ? 'bg-green-900/20' : 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      title: 'Valor Total',
      value: formatCurrency(metrics?.totalValue || 0),
      icon: DollarSign,
      color: 'emerald',
      bgColor: isDarkMode ? 'bg-emerald-900/20' : 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      isLarge: true
    },
    {
      title: 'Entregas Atrasadas',
      value: metrics?.delayedDeliveries || 0,
      icon: AlertTriangle,
      color: 'red',
      bgColor: isDarkMode ? 'bg-red-900/20' : 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      alert: (metrics?.delayedDeliveries || 0) > 0
    },
    {
      title: 'Entregas Próximas',
      value: metrics?.upcomingDeliveries || 0,
      subtitle: 'Próximos 5 dias',
      icon: Clock,
      color: 'amber',
      bgColor: isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-200'
    }
  ];

  // Debug: Log dos cards processados
  console.log('ProductMetricsCards - Cards processados:', cards);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} border ${card.borderColor} rounded-xl p-5 transition-all duration-200 hover:shadow-md ${
            card.alert ? 'ring-2 ring-red-400 animate-pulse' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            {card.alert && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                Atenção
              </span>
            )}
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
        </div>
      ))}
    </div>
  );
}
