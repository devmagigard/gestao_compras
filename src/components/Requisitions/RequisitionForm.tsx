import React, { useState, useEffect } from 'react';
import { X, Calendar, CreditCard, Truck } from 'lucide-react';
import { Requisition } from '../../types';
import { REQUISITION_STATUSES, CRITICALITY_LEVELS, COMMON_CATEGORIES, QUOTATION_TYPES } from '../../utils/constants';
import { addDays, getCurrentDate, isValidDate } from '../../utils/dateHelpers';
import { normalizeProjectName } from '../../utils/formatters';
import { DateInput } from '../UI/DateInput';

interface RequisitionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (requisition: Omit<Requisition, 'id' | 'createdAt' | 'updatedAt'>) => void;
  requisition?: Requisition | null;
  uniqueValues: {
    projects: string[];
    categories: string[];
    suppliers: string[];
  };
}

export function RequisitionForm({ isOpen, onClose, onSave, requisition, uniqueValues }: RequisitionFormProps) {
  const [formData, setFormData] = useState({
    rc: '',
    project: '',
    category: '',
    item: '',
    freight: false,
    supplier: '',
    observations: '',
    poSent: '',
    status: 'Em cotação',
    updateDate: getCurrentDate(),
    adtInvoice: '',
    quotationDeadline: '',
    omieInclusion: '',
    deliveryForecast: '',
    quotationInclusion: '',
    sentForApproval: '',
    omieApproval: '',
    criticality: 'Média',
    dismemberedRc: '',
    invoiceValue: '' as any,
    invoiceNumber: '',
    paymentMethod: '',
    dueDate1: '',
    dueDate2: '',
    dueDate3: '',
    quotedBy: '',
    freightValue: '' as any,
    freightStatus: '',
    quotedSupplier: '',
    quotationType: 'Simples'
  });

  // Atualizar formData quando a requisição mudar
  useEffect(() => {
    if (!isOpen) return; // Só executa quando o modal está aberto
    
    if (requisition) {
      setFormData({
        rc: requisition.rc || '',
        project: requisition.project || '',
        category: requisition.category || '',
        item: requisition.item || '',
        freight: requisition.freight || false,
        supplier: requisition.supplier || '',
        observations: requisition.observations || '',
        poSent: requisition.poSent || '',
        status: requisition.status || 'Em cotação',
        updateDate: requisition.updateDate || getCurrentDate(),
        adtInvoice: requisition.adtInvoice || '',
        quotationDeadline: requisition.quotationDeadline || '',
        omieInclusion: requisition.omieInclusion || '',
        deliveryForecast: requisition.deliveryForecast || '',
        quotationInclusion: requisition.quotationInclusion || '',
        sentForApproval: requisition.sentForApproval || '',
        omieApproval: requisition.omieApproval || '',
        criticality: requisition.criticality || 'Média',
        dismemberedRc: requisition.dismemberedRc || '',
        invoiceValue: requisition.invoiceValue || '' as any,
        invoiceNumber: requisition.invoiceNumber || '',
        paymentMethod: requisition.paymentMethod || '',
        dueDate1: requisition.dueDate1 || '',
        dueDate2: requisition.dueDate2 || '',
        dueDate3: requisition.dueDate3 || '',
        quotedBy: requisition.quotedBy || '',
        freightValue: requisition.freightValue || '' as any,
        freightStatus: requisition.freightStatus || '',
        freightCompany: requisition.freightCompany || '',
        quotedSupplier: requisition.quotedSupplier || '',
        quotationType: requisition.quotationType || 'Simples'
      });
    } else {
      // Resetar para valores padrão quando não há requisição (novo item)
      setFormData({
        rc: '',
        project: '',
        category: '',
        item: '',
        freight: false,
        supplier: '',
        observations: '',
        poSent: '',
        status: 'Em cotação',
        updateDate: getCurrentDate(),
        adtInvoice: '',
        quotationDeadline: '',
        omieInclusion: '',
        deliveryForecast: '',
        quotationInclusion: '',
        sentForApproval: '',
        omieApproval: '',
        criticality: 'Média',
        dismemberedRc: '',
        invoiceValue: '' as any,
        invoiceNumber: '',
        paymentMethod: '',
        dueDate1: '',
        dueDate2: '',
        dueDate3: '',
        quotedBy: '',
        freightValue: '' as any,
        freightStatus: '',
        freightCompany: '',
        quotedSupplier: '',
        quotationType: 'Simples'
      });
    }
  }, [requisition, isOpen]);

  // Cálculo automático das datas baseado no tipo de cotação
  useEffect(() => {
    if (formData.quotationInclusion && formData.quotationInclusion.trim() !== '') {
      // Calcular prazo de cotação baseado no tipo
      const quotationDays = formData.quotationType === 'Simples' ? 7 : 14;
      
      // Converter data brasileira para ISO se necessário
      let isoDate = formData.quotationInclusion;
      if (formData.quotationInclusion.includes('/')) {
        isoDate = convertBrazilianToISO(formData.quotationInclusion);
      }
      
      if (isoDate && isValidDate(isoDate)) {
        const calculatedQuotationDeadline = addDays(isoDate, quotationDays);
        
        // Calcular previsão de entrega (prazo cotação + 14 dias)
        const calculatedDeliveryForecast = addDays(calculatedQuotationDeadline, 14);
        
        setFormData(prev => ({
          ...prev,
          quotationDeadline: calculatedQuotationDeadline,
          deliveryForecast: calculatedDeliveryForecast
        }));
      }
    } else {
      // Se não há data de inclusão, limpar as datas calculadas
      setFormData(prev => ({
        ...prev,
        quotationDeadline: '',
        deliveryForecast: ''
      }));
    }
  }, [formData.quotationInclusion, formData.quotationType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Automaticamente atualizar a data de atualização para hoje
    const updatedFormData = {
      ...formData,
      updateDate: getCurrentDate()
    };
    
    onSave(updatedFormData as any);
    onClose();
  };

  const handleChange = (field: string, value: any) => {
    // Para campos numéricos, permitir string vazia
    if (field === 'invoiceValue' || field === 'freightValue') {
      if (value === '') {
        setFormData(prev => ({ ...prev, [field]: '' as any }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Combinar categorias únicas com categorias comuns
  const allCategories = [...new Set([...COMMON_CATEGORIES, ...uniqueValues.categories])];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">
            {requisition ? 'Editar Requisição' : 'Nova Requisição'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-8">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Informações Básicas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RC *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.rc}
                    onChange={(e) => handleChange('rc', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RC Desmembrado
                  </label>
                  <input
                    type="text"
                    value={formData.dismemberedRc}
                    onChange={(e) => handleChange('dismemberedRc', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {REQUISITION_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Criticidade
                  </label>
                  <select
                    value={formData.criticality}
                    onChange={(e) => handleChange('criticality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {CRITICALITY_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Cotação
                  </label>
                  <select
                    value={formData.quotationType}
                    onChange={(e) => handleChange('quotationType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {QUOTATION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.quotationType === 'Simples' ? 'Prazo: 7 dias' : 'Prazo: 14 dias'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Projeto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.project}
                    onChange={(e) => handleChange('project', normalizeProjectName(e.target.value))}
                    list="projects"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <datalist id="projects">
                    {uniqueValues.projects.map(project => (
                      <option key={project} value={project} />
                    ))}
                  </datalist>
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: PXXX (ex: P154, P216, P292)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    list="categories"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <datalist id="categories">
                    {allCategories.map(category => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item/Descrição *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.item}
                  onChange={(e) => handleChange('item', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  rows={4}
                  value={formData.observations}
                  onChange={(e) => handleChange('observations', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Observações sobre a requisição..."
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.observations.length}/2000 caracteres
                </p>
              </div>
            </div>

            {/* Fornecedores e Cotação */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Fornecedores e Cotação
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => handleChange('supplier', e.target.value)}
                    list="suppliers"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <datalist id="suppliers">
                    {uniqueValues.suppliers.map(supplier => (
                      <option key={supplier} value={supplier} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cotado Por
                  </label>
                  <input
                    type="text"
                    value={formData.quotedBy}
                    onChange={(e) => handleChange('quotedBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fornecedor Cotado
                  </label>
                  <input
                    type="text"
                    value={formData.quotedSupplier}
                    onChange={(e) => handleChange('quotedSupplier', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Datas Importantes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Datas Importantes
              </h3>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Datas Calculadas Automaticamente
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Inclusão para Cotação *
                    </label>
                    <DateInput
                      value={formData.quotationInclusion}
                      onChange={(e) => handleChange('quotationInclusion', e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-blue-600 mt-1">
                      Base para cálculo das demais datas
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Prazo Cotação (Calculado)
                    </label>
                    <DateInput
                      value={formData.quotationDeadline}
                      onChange={() => {}} // Read-only
                      disabled={true}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-blue-100 text-blue-800 cursor-not-allowed"
                    />
                    <p className="text-xs text-blue-600 mt-1">
                      +{formData.quotationType === 'Simples' ? '7' : '14'} dias da inclusão
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Previsão de Entrega (Calculada)
                    </label>
                    <DateInput
                      value={formData.deliveryForecast}
                      onChange={(e) => handleChange('deliveryForecast', e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-blue-600 mt-1">
                      Calculada automaticamente, mas pode ser editada
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>💡 Dica:</strong> A previsão de entrega é calculada automaticamente (+14 dias do prazo de cotação), 
                    mas você pode editá-la com a data mais precisa fornecida pelo fornecedor. 
                    Se alterar a "Inclusão para Cotação\" ou \"Tipo de Cotação", a previsão será recalculada.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Data Atualização
                  </label>
                  <DateInput
                    value={formData.updateDate}
                    onChange={(e) => handleChange('updateDate', e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Data da última atualização da requisição
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inclusão no OMIE
                  </label>
                  <DateInput
                    value={formData.omieInclusion}
                    onChange={(e) => handleChange('omieInclusion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enviado para Aprovação
                  </label>
                  <DateInput
                    value={formData.sentForApproval}
                    onChange={(e) => handleChange('sentForApproval', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aprovação OMIE
                  </label>
                  <DateInput
                    value={formData.omieApproval}
                    onChange={(e) => handleChange('omieApproval', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PO Enviado
                  </label>
                  <DateInput
                    value={formData.poSent}
                    onChange={(e) => handleChange('poSent', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Informações Financeiras */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                Informações Financeiras
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor NF (R$)
                  </label>
                  <input
                     type="text"
                     value={typeof formData.freightValue === 'number' && formData.freightValue !== 0 
                       ? formData.freightValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                       : formData.freightValue === '' ? '' : ''}
                     onChange={(e) => {
                       const value = e.target.value;
                       if (value === '') {
                         handleChange('freightValue', '');
                       } else {
                         const numericValue = value.replace(/\./g, '').replace(',', '.');
                         const parsed = parseFloat(numericValue);
                         if (!isNaN(parsed)) {
                           handleChange('freightValue', parsed);
                         } else if (value.match(/^[\d,\.]*$/)) {
                           // Permite continuar digitando números incompletos
                           handleChange('freightValue', value);
                         }
                       }
                     }}
                     placeholder="0,00"
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                   />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número NF
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ADT / Fatura
                  </label>
                  <input
                    type="text"
                    value={formData.adtInvoice}
                    onChange={(e) => handleChange('adtInvoice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Pagamento
                  </label>
                  <input
                    type="text"
                    value={formData.paymentMethod}
                    onChange={(e) => handleChange('paymentMethod', e.target.value)}
                    placeholder="Ex: À vista, 30/60/90 dias..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Campos de Vencimento - Condicionais */}
              {formData.paymentMethod && formData.paymentMethod.trim() !== '' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">Vencimentos das Parcelas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Vencimento Parcela 1
                      </label>
                      <DateInput
                        value={formData.dueDate1}
                        onChange={(e) => handleChange('dueDate1', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Vencimento Parcela 2
                      </label>
                      <DateInput
                        value={formData.dueDate2}
                        onChange={(e) => handleChange('dueDate2', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Vencimento Parcela 3
                      </label>
                      <DateInput
                        value={formData.dueDate3}
                        onChange={(e) => handleChange('dueDate3', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controle de Frete */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-orange-600" />
                Controle de Frete
              </h3>
              
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.freight}
                    onChange={(e) => handleChange('freight', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">Esta requisição possui frete</span>
                </label>
              </div>

              {/* Campos de Frete - Condicionais */}
              {formData.freight && (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="text-sm font-medium text-orange-900 mb-3">Informações do Frete</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-2">
                        Valor do Frete (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.freightValue}
                        onChange={(e) => handleChange('freightValue', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                        placeholder="0,00"
                        className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-2">
                        Status do Frete
                      </label>
                      <input
                        type="text"
                        value={formData.freightStatus}
                        onChange={(e) => handleChange('freightStatus', e.target.value)}
                        placeholder="Ex: Aguardando coleta, Em trânsito..."
                        className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-2">
                        Transportadora
                      </label>
                      <input
                        type="text"
                        value={formData.freightCompany}
                        onChange={(e) => handleChange('freightCompany', e.target.value)}
                        placeholder="Ex: Correios, Transportadora XYZ..."
                        className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {requisition ? 'Atualizar Requisição' : 'Criar Requisição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}