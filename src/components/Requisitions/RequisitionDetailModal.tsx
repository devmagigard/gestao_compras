import React from 'react';
import { X, Calendar, CreditCard, Truck, Package, User, FileText, Clock, AlertTriangle } from 'lucide-react';
import { Requisition } from '../../types';
import { STATUS_COLORS, CRITICALITY_COLORS } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface RequisitionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: Requisition | null;
}

export function RequisitionDetailModal({ isOpen, onClose, requisition }: RequisitionDetailModalProps) {
  if (!isOpen || !requisition) return null;

  const InfoCard = ({ title, children, icon: Icon, color = 'blue' }: {
    title: string;
    children: React.ReactNode;
    icon: React.ComponentType<any>;
    color?: string;
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className={`px-4 py-3 bg-${color}-50 border-b border-${color}-100`}>
        <h3 className={`text-sm font-semibold text-${color}-900 flex items-center`}>
          <Icon className={`h-4 w-4 mr-2 text-${color}-600`} />
          {title}
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {children}
      </div>
    </div>
  );

  const InfoRow = ({ label, value, highlight = false }: {
    label: string;
    value: string | number | React.ReactNode;
    highlight?: boolean;
  }) => (
    <div className="flex justify-between items-start">
      <span className="text-sm font-medium text-gray-600 min-w-0 flex-1 mr-3">{label}:</span>
      <span className={`text-sm text-right min-w-0 flex-1 ${highlight ? 'font-semibold text-gray-900' : 'text-gray-900'}`}>
        {value || '-'}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-50 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Detalhes da Requisição RC {requisition.rc}
              </h2>
              <p className="text-sm text-gray-500">
                Criada em {formatDate(requisition.createdAt)} • Atualizada em {formatDate(requisition.updatedAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* Informações Básicas */}
            <InfoCard title="Informações Básicas" icon={Package} color="blue">
              <InfoRow label="RC" value={requisition.rc} highlight />
              {requisition.dismemberedRc && (
                <InfoRow label="RC Desmembrado" value={requisition.dismemberedRc} />
              )}
              <InfoRow label="Projeto" value={requisition.project} highlight />
              <InfoRow label="Categoria" value={requisition.category} />
              <InfoRow 
                label="Status" 
                value={
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[requisition.status]}`}>
                    {requisition.status}
                  </span>
                } 
              />
              <InfoRow 
                label="Criticidade" 
                value={
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${CRITICALITY_COLORS[requisition.criticality]}`}>
                    {requisition.criticality}
                  </span>
                } 
              />
              <InfoRow label="Tipo de Cotação" value={requisition.quotationType} />
            </InfoCard>

            {/* Item e Observações */}
            <div className="lg:col-span-2 xl:col-span-1">
              <InfoCard title="Item e Observações" icon={FileText} color="gray">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Item/Descrição:</span>
                    <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg border">
                      {requisition.item}
                    </p>
                  </div>
                  {requisition.observations && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Observações:</span>
                      <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg border">
                        {requisition.observations}
                      </p>
                    </div>
                  )}
                </div>
              </InfoCard>
            </div>

            {/* Fornecedores */}
            <InfoCard title="Fornecedores e Cotação" icon={User} color="green">
              <InfoRow label="Fornecedor" value={requisition.supplier} />
              <InfoRow label="Cotado Por" value={requisition.quotedBy} />
              <InfoRow label="Fornecedor Cotado" value={requisition.quotedSupplier} />
            </InfoCard>

            {/* Datas Importantes */}
            <InfoCard title="Cronograma" icon={Calendar} color="purple">
              <InfoRow label="Data Atualização" value={formatDate(requisition.updateDate)} />
              <InfoRow label="Inclusão p/ Cotação" value={formatDate(requisition.quotationInclusion)} />
              <InfoRow label="Prazo Cotação" value={formatDate(requisition.quotationDeadline)} />
              <InfoRow label="Previsão Entrega" value={formatDate(requisition.deliveryForecast)} />
              <InfoRow label="Inclusão OMIE" value={formatDate(requisition.omieInclusion)} />
              <InfoRow label="Enviado p/ Aprovação" value={formatDate(requisition.sentForApproval)} />
              <InfoRow label="Aprovação OMIE" value={formatDate(requisition.omieApproval)} />
              <InfoRow label="PO Enviado" value={formatDate(requisition.poSent)} />
            </InfoCard>

            {/* Informações Financeiras */}
            <InfoCard title="Informações Financeiras" icon={CreditCard} color="emerald">
              <InfoRow 
                label="Valor NF" 
                value={requisition.invoiceValue > 0 ? formatCurrency(requisition.invoiceValue) : '-'} 
                highlight={requisition.invoiceValue > 0}
              />
              <InfoRow label="Número NF" value={requisition.invoiceNumber} />
              <InfoRow label="ADT / Fatura" value={requisition.adtInvoice} />
              <InfoRow label="Forma Pagamento" value={requisition.paymentMethod} />
              
              {/* Vencimentos - só mostra se houver forma de pagamento */}
              {requisition.paymentMethod && (
                <>
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vencimentos</span>
                  </div>
                  <InfoRow label="Parcela 1" value={formatDate(requisition.dueDate1)} />
                  <InfoRow label="Parcela 2" value={formatDate(requisition.dueDate2)} />
                  <InfoRow label="Parcela 3" value={formatDate(requisition.dueDate3)} />
                </>
              )}
            </InfoCard>

            {/* Controle de Frete */}
            <InfoCard title="Controle de Frete" icon={Truck} color="orange">
              <InfoRow 
                label="Possui Frete" 
                value={
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    requisition.freight 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {requisition.freight ? 'Sim' : 'Não'}
                  </span>
                } 
              />
              
              {/* Informações do frete - só mostra se tiver frete */}
              {requisition.freight && (
                <>
                  <InfoRow 
                    label="Valor Frete" 
                    value={requisition.freightValue > 0 ? formatCurrency(requisition.freightValue) : '-'} 
                    highlight={requisition.freightValue > 0}
                  />
                  <InfoRow label="Status Frete" value={requisition.freightStatus} />
                  <InfoRow label="Transportadora" value={requisition.freightCompany} />
                </>
              )}
            </InfoCard>

            {/* Resumo de Status */}
            <div className="lg:col-span-2 xl:col-span-3">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center mb-3">
                  <AlertTriangle className="h-4 w-4 mr-2 text-gray-600" />
                  Resumo Rápido
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${requisition.status === 'Concluído' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">{requisition.status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      requisition.criticality === 'Urgente' ? 'bg-red-500' : 
                      requisition.criticality === 'Alta' ? 'bg-orange-500' : 
                      requisition.criticality === 'Média' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <span className="text-gray-600">Criticidade:</span>
                    <span className="font-medium">{requisition.criticality}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${requisition.freight ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
                    <span className="text-gray-600">Frete:</span>
                    <span className="font-medium">{requisition.freight ? 'Sim' : 'Não'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${requisition.invoiceValue > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-medium">
                      {requisition.invoiceValue > 0 ? formatCurrency(requisition.invoiceValue) : 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}