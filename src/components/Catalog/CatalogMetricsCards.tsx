import React from 'react';
import { BookOpen, Users, BarChart2, TrendingUp } from 'lucide-react';
import { CatalogMetrics } from '../../types';

interface CatalogMetricsCardsProps {
  metrics: CatalogMetrics;
  isDarkMode?: boolean;
}

export function CatalogMetricsCards({ metrics, isDarkMode = false }: CatalogMetricsCardsProps) {
  const cards = [
    {
      title: 'Produtos Cadastrados',
      value: metrics.totalProducts,
      icon: BookOpen,
      bgColor: isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Fornecedores Vinculados',
      value: metrics.totalSuppliers,
      icon: Users,
      bgColor: isDarkMode ? 'bg-teal-900/20' : 'bg-teal-50',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-200'
    },
    {
      title: 'Com Historico de Preco',
      value: metrics.productsWithHistory,
      icon: BarChart2,
      bgColor: isDarkMode ? 'bg-emerald-900/20' : 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-200'
    },
    {
      title: 'Preco Medio (Ultimo)',
      value: metrics.avgPrice > 0
        ? `R$ ${metrics.avgPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '-',
      icon: TrendingUp,
      bgColor: isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      isText: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} border ${card.borderColor} rounded-xl p-5 transition-all duration-200 hover:shadow-md`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
          </div>
          <h3 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {card.title}
          </h3>
          <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} ${card.isText ? 'text-xl' : ''}`}>
            {card.isText ? card.value : (typeof card.value === 'number' ? card.value.toLocaleString('pt-BR') : card.value)}
          </div>
        </div>
      ))}
    </div>
  );
}
