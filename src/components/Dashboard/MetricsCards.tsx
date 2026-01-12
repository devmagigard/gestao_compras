import React from 'react';
import { DashboardMetrics } from '../../types';
import { FileText, Clock, CheckCircle, AlertTriangle, DollarSign, Zap, Receipt, AlertCircle, CalendarClock, Truck } from 'lucide-react';

interface MetricsCardsProps {
  metrics: DashboardMetrics;
  isDarkMode?: boolean;
}

export function MetricsCards({ metrics, isDarkMode = false }: MetricsCardsProps) {
  const cards = [
    {
      title: 'Total de Requisições',
      value: metrics.totalRequisitions,
      icon: FileText,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Pendente Aprovação',
      value: metrics.pendingApproval,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Em Cotação',
      value: metrics.inQuotation,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      title: 'Aguardando Fatura',
      value: metrics.waitingForInvoice,
      icon: Receipt,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Aguardando Entrega',
      value: metrics.waitingForDelivery || 0,
      icon: Truck,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-600'
    },
    {
      title: 'Concluídas',
      value: metrics.completed,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Entregas Atrasadas',
      value: metrics.delayedDeliveries,
      icon: AlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      urgent: true
    },
    {
      title: 'Entregas em 5 Dias',
      value: metrics.upcomingDeliveries,
      icon: CalendarClock,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      warning: true
    },
    {
      title: 'Itens Urgentes',
      value: metrics.urgentItems,
      icon: Zap,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`rounded-lg shadow-sm border p-4 lg:p-5 hover:shadow-md transition-all duration-200 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          } ${
            card.urgent && card.value > 0 
              ? 'ring-2 ring-red-500 ring-opacity-50 animate-pulse' 
              : card.warning && card.value > 0 
              ? 'ring-2 ring-amber-500 ring-opacity-50' 
              : ''
          }`}
        >
          <div className="flex items-center">
            <div className={`${card.color} rounded-lg p-3 mr-4 ${
              card.urgent && card.value > 0 ? 'animate-pulse' : ''
            }`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {card.title}
              </p>
              <p className={`text-xl lg:text-2xl font-bold ${card.textColor} ${
                card.urgent && card.value > 0 ? 'animate-pulse' : ''
              }`}>
                {typeof card.value === 'number' ? card.value.toLocaleString('pt-BR') : card.value}
              </p>
              {card.urgent && card.value > 0 && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  ⚠️ Ação necessária!
                </p>
              )}
              {card.warning && card.value > 0 && (
                <p className="text-xs text-amber-600 font-medium mt-1">
                  📅 Prazo próximo
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}