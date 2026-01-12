import React from 'react';
import { Requisition } from '../../types';
import { Clock, Package, User, Truck, DollarSign, AlertCircle, CalendarClock } from 'lucide-react';
import { STATUS_COLORS, CRITICALITY_COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import { createLocalDate } from '../../utils/dateHelpers';

interface RecentActivityProps {
  requisitions: Requisition[];
  isDarkMode?: boolean;
}

export function RecentActivity({ requisitions, isDarkMode = false }: RecentActivityProps) {
  const recentRequisitions = requisitions
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

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

  // Função para verificar se uma requisição tem entrega próxima
  const isUpcomingDelivery = (requisition: Requisition) => {
    if (!requisition.deliveryForecast) return false;
    if (requisition.status === 'Concluído' || requisition.status === 'Entregue') return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveryDate = createLocalDate(requisition.deliveryForecast);
    deliveryDate.setHours(0, 0, 0, 0);
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(today.getDate() + 5);
    
    return deliveryDate >= today && deliveryDate <= fiveDaysFromNow;
  };
  return (
    <div className={`rounded-lg shadow-sm border ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className={`px-6 py-4 border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <h3 className={`text-lg font-medium flex items-center ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <Clock className={`h-5 w-5 mr-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          Atividades Recentes
        </h3>
      </div>
      
      <div className={`divide-y ${
        isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
      }`}>
        {recentRequisitions.length > 0 ? (
          recentRequisitions.map((req) => (
            <div 
              key={req.id} 
              className={`px-4 py-3 transition-colors ${
                isDelayedDelivery(req)
                  ? isDarkMode 
                    ? 'bg-red-900/20 hover:bg-red-900/30 border-l-4 border-red-500' 
                    : 'bg-red-50/50 hover:bg-red-50/80 border-l-4 border-red-500'
                  : isUpcomingDelivery(req)
                  ? isDarkMode 
                    ? 'bg-amber-900/20 hover:bg-amber-900/30 border-l-4 border-amber-500' 
                    : 'bg-amber-50/50 hover:bg-amber-50/80 border-l-4 border-amber-500'
                  : isDarkMode 
                  ? 'hover:bg-gray-700' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      RC {req.rc}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status]}`}>
                      {req.status}
                    </span>
                    {req.criticality && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CRITICALITY_COLORS[req.criticality]}`}>
                        {req.criticality}
                      </span>
                    )}
                    {(isDelayedDelivery(req) || isUpcomingDelivery(req)) && (
                      <div className="flex items-center space-x-1">
                        {isDelayedDelivery(req) && (
                          <span className="inline-flex items-center text-red-600" title="Entrega atrasada">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Atrasado
                          </span>
                        )}
                        {isUpcomingDelivery(req) && !isDelayedDelivery(req) && (
                          <span className="inline-flex items-center text-amber-600" title="Entrega próxima">
                            <CalendarClock className="h-3 w-3 mr-1" />
                            Próximo
                          </span>
                        )}
                      </div>
                    )}
                    {req.freight && (
                      <span className="inline-flex items-center text-orange-600">
                        <Truck className="h-3 w-3 mr-1" />
                        Frete
                        {req.freightValue > 0 && (
                          <span className="ml-1">
                            ({formatCurrency(req.freightValue)})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-sm truncate mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {req.item}
                  </p>
                  
                  <div className={`flex flex-wrap items-center text-xs gap-x-4 gap-y-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <div className="flex items-center">
                      <Package className="h-3 w-3 mr-1" />
                      {req.project}
                    </div>
                    {req.supplier && (
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {req.supplier}
                      </div>
                    )}
                    {req.freight && (
                      <div className="flex items-center text-orange-600">
                        <Truck className="h-3 w-3 mr-1" />
                        <span className="font-medium">Frete</span>
                        {req.freightValue > 0 && (
                          <span className="ml-1">
                            ({new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(req.freightValue)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={`text-xs ml-4 flex-shrink-0 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {new Date(req.updatedAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            <Package className={`h-12 w-12 mx-auto mb-4 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-300'
            }`} />
            <p>Nenhuma requisição encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}