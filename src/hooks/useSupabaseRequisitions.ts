import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Requisition, FilterState, DashboardMetrics } from '../types';
import { normalizeProjectName } from '../utils/formatters';
import { createLocalDate } from '../utils/dateHelpers';

// Função para converter dados do Supabase para o formato da aplicação
function convertFromSupabase(data: any): Requisition {
  // Helper function to ensure date is in YYYY-MM-DD format without timezone issues
  const formatDateField = (dateValue: any): string => {
    if (!dateValue) return '';
    
    // If it's already a string in YYYY-MM-DD format, return as is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // If it's a Date object or string with time, extract just the date part
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      
      // Use getFullYear, getMonth, getDate to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  return {
    id: data.id,
    rc: data.rc,
    project: normalizeProjectName(data.project),
    category: data.category || '',
    item: data.item,
    freight: data.freight,
    supplier: data.supplier || '',
    observations: data.observations || '',
    poSent: formatDateField(data.po_sent),
    status: data.status,
    updateDate: formatDateField(data.update_date),
    adtInvoice: data.adt_invoice || '',
    quotationDeadline: formatDateField(data.quotation_deadline),
    omieInclusion: formatDateField(data.omie_inclusion),
    deliveryForecast: formatDateField(data.delivery_forecast),
    quotationInclusion: formatDateField(data.quotation_inclusion),
    sentForApproval: formatDateField(data.sent_for_approval),
    omieApproval: formatDateField(data.omie_approval),
    criticality: data.criticality,
    dismemberedRc: data.dismembered_rc || '',
    invoiceValue: data.invoice_value || 0,
    invoiceNumber: data.invoice_number || '',
    paymentMethod: data.payment_method || '',
    dueDate1: formatDateField(data.due_date_1),
    dueDate2: formatDateField(data.due_date_2),
    dueDate3: formatDateField(data.due_date_3),
    quotedBy: data.quoted_by || '',
    freightValue: data.freight_value || 0,
    freightStatus: data.freight_status || '',
    freightCompany: data.freight_company || '',
    quotedSupplier: data.quoted_supplier || '',
    quotationType: data.quotation_type,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

// Função para converter dados da aplicação para o formato do Supabase
function convertToSupabase(data: Omit<Requisition, 'id' | 'createdAt' | 'updatedAt'>) {
  // Helper function to ensure date is properly formatted for Supabase
  const formatDateForSupabase = (dateValue: string): string | null => {
    if (!dateValue || dateValue.trim() === '') return null;
    
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // Try to parse and format
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      
      // Use getFullYear, getMonth, getDate to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch {
      return null;
    }
  };

  return {
    rc: data.rc,
    project: normalizeProjectName(data.project),
    category: data.category || null,
    item: data.item,
    freight: data.freight,
    supplier: data.supplier || null,
    observations: data.observations || null,
    po_sent: formatDateForSupabase(data.poSent),
    status: data.status,
    update_date: formatDateForSupabase(data.updateDate) || new Date().toISOString().split('T')[0],
    adt_invoice: data.adtInvoice || null,
    quotation_deadline: formatDateForSupabase(data.quotationDeadline),
    omie_inclusion: formatDateForSupabase(data.omieInclusion),
    delivery_forecast: formatDateForSupabase(data.deliveryForecast),
    quotation_inclusion: formatDateForSupabase(data.quotationInclusion),
    sent_for_approval: formatDateForSupabase(data.sentForApproval),
    omie_approval: formatDateForSupabase(data.omieApproval),
    criticality: data.criticality,
    dismembered_rc: data.dismemberedRc || null,
    invoice_value: data.invoiceValue || 0,
    invoice_number: data.invoiceNumber || null,
    payment_method: data.paymentMethod || null,
    due_date_1: formatDateForSupabase(data.dueDate1),
    due_date_2: formatDateForSupabase(data.dueDate2),
    due_date_3: formatDateForSupabase(data.dueDate3),
    quoted_by: data.quotedBy || null,
    freight_value: data.freightValue || 0,
    freight_status: data.freightStatus || null,
    freight_company: data.freightCompany || null,
    quoted_supplier: data.quotedSupplier || null,
    quotation_type: data.quotationType
  };
}

export function useSupabaseRequisitions() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [filteredRequisitions, setFilteredRequisitions] = useState<Requisition[]>([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<Requisition[]>([]);
  const [currentActiveFilters, setCurrentActiveFilters] = useState<FilterState>({
    rcSearch: '',
    projectSearch: '',
    statusSearch: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar requisições do Supabase
  const loadRequisitions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('requisitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const convertedData = data?.map(convertFromSupabase) || [];
      setRequisitions(convertedData);
      setFilteredRequisitions(convertedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar requisições');
      console.error('Erro ao carregar requisições:', err);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova requisição
  const addRequisition = async (requisition: Omit<Requisition, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const supabaseData = convertToSupabase(requisition);
      const { data, error } = await supabase
        .from('requisitions')
        .insert([supabaseData])
        .select()
        .single();

      if (error) throw error;

      const newRequisition = convertFromSupabase(data);
      setRequisitions(prev => [newRequisition, ...prev]);
      setFilteredRequisitions(prev => [newRequisition, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar requisição');
      console.error('Erro ao adicionar requisição:', err);
    }
  };

  // Atualizar requisição
  const updateRequisition = async (id: string, updates: Partial<Requisition>) => {
    try {
      // Helper function to format dates for Supabase
      const formatDateForSupabase = (dateValue: string): string | null => {
        if (!dateValue || dateValue.trim() === '') return null;
        
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return dateValue;
        }
        
        // Try to parse and format
        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return null;
          
          // Use getFullYear, getMonth, getDate to avoid timezone issues
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          
          return `${year}-${month}-${day}`;
        } catch {
          return null;
        }
      };

      // Converter campos para formato do Supabase
      const supabaseUpdates: any = {};
      
      if (updates.rc !== undefined) supabaseUpdates.rc = updates.rc;
      if (updates.project !== undefined) supabaseUpdates.project = updates.project;
      if (updates.category !== undefined) supabaseUpdates.category = updates.category || null;
      if (updates.item !== undefined) supabaseUpdates.item = updates.item;
      if (updates.freight !== undefined) supabaseUpdates.freight = updates.freight;
      if (updates.supplier !== undefined) supabaseUpdates.supplier = updates.supplier || null;
      if (updates.observations !== undefined) supabaseUpdates.observations = updates.observations || null;
      if (updates.poSent !== undefined) supabaseUpdates.po_sent = formatDateForSupabase(updates.poSent);
      if (updates.status !== undefined) supabaseUpdates.status = updates.status;
      if (updates.updateDate !== undefined) supabaseUpdates.update_date = formatDateForSupabase(updates.updateDate);
      if (updates.adtInvoice !== undefined) supabaseUpdates.adt_invoice = updates.adtInvoice || null;
      if (updates.quotationDeadline !== undefined) supabaseUpdates.quotation_deadline = formatDateForSupabase(updates.quotationDeadline);
      if (updates.omieInclusion !== undefined) supabaseUpdates.omie_inclusion = formatDateForSupabase(updates.omieInclusion);
      if (updates.deliveryForecast !== undefined) supabaseUpdates.delivery_forecast = formatDateForSupabase(updates.deliveryForecast);
      if (updates.quotationInclusion !== undefined) supabaseUpdates.quotation_inclusion = formatDateForSupabase(updates.quotationInclusion);
      if (updates.sentForApproval !== undefined) supabaseUpdates.sent_for_approval = formatDateForSupabase(updates.sentForApproval);
      if (updates.omieApproval !== undefined) supabaseUpdates.omie_approval = formatDateForSupabase(updates.omieApproval);
      if (updates.criticality !== undefined) supabaseUpdates.criticality = updates.criticality;
      if (updates.dismemberedRc !== undefined) supabaseUpdates.dismembered_rc = updates.dismemberedRc || null;
      if (updates.invoiceValue !== undefined) supabaseUpdates.invoice_value = updates.invoiceValue || 0;
      if (updates.invoiceNumber !== undefined) supabaseUpdates.invoice_number = updates.invoiceNumber || null;
      if (updates.paymentMethod !== undefined) supabaseUpdates.payment_method = updates.paymentMethod || null;
      if (updates.dueDate1 !== undefined) supabaseUpdates.due_date_1 = formatDateForSupabase(updates.dueDate1);
      if (updates.dueDate2 !== undefined) supabaseUpdates.due_date_2 = formatDateForSupabase(updates.dueDate2);
      if (updates.dueDate3 !== undefined) supabaseUpdates.due_date_3 = formatDateForSupabase(updates.dueDate3);
      if (updates.quotedBy !== undefined) supabaseUpdates.quoted_by = updates.quotedBy || null;
      if (updates.freightValue !== undefined) supabaseUpdates.freight_value = updates.freightValue || 0;
      if (updates.freightStatus !== undefined) supabaseUpdates.freight_status = updates.freightStatus || null;
      if (updates.freightCompany !== undefined) supabaseUpdates.freight_company = updates.freightCompany || null;
      if (updates.quotedSupplier !== undefined) supabaseUpdates.quoted_supplier = updates.quotedSupplier || null;
      if (updates.quotationType !== undefined) supabaseUpdates.quotation_type = updates.quotationType;

      const { data, error } = await supabase
        .from('requisitions')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedRequisition = convertFromSupabase(data);
      
      setRequisitions(prev => 
        prev.map(req => req.id === id ? updatedRequisition : req)
      );
      setFilteredRequisitions(prev => 
        prev.map(req => req.id === id ? updatedRequisition : req)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar requisição');
      console.error('Erro ao atualizar requisição:', err);
    }
  };

  // Deletar requisição
  const deleteRequisition = async (id: string) => {
    try {
      const { error } = await supabase
        .from('requisitions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRequisitions(prev => prev.filter(req => req.id !== id));
      setFilteredRequisitions(prev => prev.filter(req => req.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar requisição');
      console.error('Erro ao deletar requisição:', err);
    }
  };

  // Importação em lote
  const bulkImport = async (newRequisitions: Requisition[]) => {
    try {
      console.log('Iniciando bulkImport com:', newRequisitions.length, 'requisições');
      
      // Remover campos id, createdAt e updatedAt antes de enviar para o Supabase
      const supabaseData = newRequisitions.map((req, index) => {
        console.log(`Convertendo requisição ${index + 1}:`, req);
        
        // Remover campos que não devem ser enviados para o Supabase
        const { id, createdAt, updatedAt, ...reqData } = req;
        const converted = convertToSupabase(reqData);
        
        console.log(`Dados convertidos para Supabase ${index + 1}:`, converted);
        return converted;
      });
      
      console.log('Enviando para Supabase:', supabaseData);
      
      const { data, error } = await supabase
        .from('requisitions')
        .insert(supabaseData)
        .select();

      if (error) throw error;

      console.log('Dados inseridos no Supabase:', data);
      
      const convertedData = data?.map(convertFromSupabase) || [];
      console.log('Dados convertidos de volta:', convertedData);
      
      // Recarregar todos os dados do Supabase para garantir sincronização
      console.log('Recarregando dados...');
      await loadRequisitions();
      console.log('Importação concluída com sucesso');
    } catch (err) {
      console.error('Erro detalhado no bulkImport:', err);
      setError(err instanceof Error ? err.message : 'Erro ao importar requisições');
      throw err; // Re-throw para que o App.tsx possa capturar o erro
    }
  };

  // Filtrar requisições
  const filterRequisitions = (filters: FilterState) => {
    // Atualizar os filtros ativos
    setCurrentActiveFilters(filters);
    
    let filtered = requisitions;

    if (filters.rcSearch) {
      const searchLower = filters.rcSearch.toLowerCase();
      filtered = filtered.filter(req =>
        req.rc.toLowerCase().includes(searchLower)
      );
    }

    if (filters.projectSearch) {
      const searchLower = filters.projectSearch.toLowerCase();
      filtered = filtered.filter(req =>
        req.project.toLowerCase().includes(searchLower) ||
        req.item.toLowerCase().includes(searchLower)
      );
    }

    if (filters.statusSearch) {
      filtered = filtered.filter(req => req.status === filters.statusSearch);
    }

    // Filtro de frete
    if (filters.freightFilter && filters.freightFilter !== 'all') {
      if (filters.freightFilter === 'with') {
        filtered = filtered.filter(req => req.freight === true);
      } else if (filters.freightFilter === 'without') {
        filtered = filtered.filter(req => req.freight === false);
      }
    }

    // Filtro de atenção para entregas
    if (filters.attentionFilter && filters.attentionFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(req => {
        // Pular se não tem previsão de entrega
        if (!req.deliveryForecast) return false;
        
        // Pular se já está concluído ou entregue
        if (req.status === 'Concluído' || req.status === 'Entregue') return false;
        
        const deliveryDate = createLocalDate(req.deliveryForecast);
        deliveryDate.setHours(0, 0, 0, 0);
        
        const isDelayed = deliveryDate < today;
        
        const fiveDaysFromNow = new Date(today);
        fiveDaysFromNow.setDate(today.getDate() + 5);
        const isUpcoming = deliveryDate >= today && deliveryDate <= fiveDaysFromNow;
        
        switch (filters.attentionFilter) {
          case 'delayed':
            return isDelayed;
          case 'upcoming':
            return isUpcoming && !isDelayed;
          case 'attention':
            return isDelayed || isUpcoming;
          default:
            return true;
        }
      });
    }
    setFilteredRequisitions(filtered);
  };

  // Métricas do dashboard
  const getDashboardMetrics = (): DashboardMetrics => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zerar horas para comparação apenas de data
    
    // Requisições não concluídas (ainda em processo)
    const activeRequisitions = requisitions.filter(req => 
      req.status !== 'Concluído' && req.status !== 'Entregue'
    );
    
    // Entregas atrasadas: previsão de entrega no passado e ainda não concluída
    const delayedDeliveries = activeRequisitions.filter(req => {
      if (!req.deliveryForecast) return false;
      const deliveryDate = createLocalDate(req.deliveryForecast);
      deliveryDate.setHours(0, 0, 0, 0);
      return deliveryDate < today;
    }).length;
    
    // Entregas próximas: previsão de entrega em 5 dias ou menos
    const upcomingDeliveries = activeRequisitions.filter(req => {
      if (!req.deliveryForecast) return false;
      const deliveryDate = createLocalDate(req.deliveryForecast);
      deliveryDate.setHours(0, 0, 0, 0);
      const fiveDaysFromNow = new Date(today);
      fiveDaysFromNow.setDate(today.getDate() + 5);
      return deliveryDate >= today && deliveryDate <= fiveDaysFromNow;
    }).length;
    
    return {
      totalRequisitions: requisitions.length,
      pendingApproval: requisitions.filter(req => req.status === 'Em Aprovação').length,
      inQuotation: requisitions.filter(req => req.status === 'Em cotação').length,
      completed: requisitions.filter(req => req.status === 'Concluído').length,
      waitingForInvoice: requisitions.filter(req => req.status === 'Ag.Fatura').length,
      waitingForDelivery: requisitions.filter(req => req.status === 'Ag.Entrega').length,
      totalValue: requisitions.reduce((sum, req) => sum + req.invoiceValue, 0),
      urgentItems: requisitions.filter(req => req.criticality === 'Urgente').length,
      delayedDeliveries,
      upcomingDeliveries,
    };
  };

  // Valores únicos para filtros
  const getUniqueValues = () => {
    return {
      projects: [...new Set(requisitions.map(req => req.project).filter(Boolean))],
      categories: [...new Set(requisitions.map(req => req.category).filter(Boolean))],
      suppliers: [...new Set(requisitions.map(req => req.supplier).filter(Boolean))],
    };
  };

  // Função para calcular entregas próximas (para alertas visuais na tabela)
  const calculateUpcomingDeliveries = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeRequisitions = requisitions.filter(req => 
      req.status !== 'Concluído' && req.status !== 'Entregue'
    );
    
    const upcoming = activeRequisitions.filter(req => {
      if (!req.deliveryForecast) return false;
      const deliveryDate = createLocalDate(req.deliveryForecast);
      deliveryDate.setHours(0, 0, 0, 0);
      const fiveDaysFromNow = new Date(today);
      fiveDaysFromNow.setDate(today.getDate() + 5);
      return deliveryDate >= today && deliveryDate <= fiveDaysFromNow;
    });
    
    setUpcomingDeliveries(upcoming);
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadRequisitions();
  }, []);

  // Recarregar filtros quando requisições mudarem
  useEffect(() => {
    // Reaplicar os filtros ativos sempre que as requisições mudarem
    filterRequisitions(currentActiveFilters);
    // Recalcular entregas próximas
    calculateUpcomingDeliveries();
  }, [requisitions, currentActiveFilters]);

  return {
    requisitions,
    filteredRequisitions,
    upcomingDeliveries,
    loading,
    error,
    addRequisition,
    updateRequisition,
    deleteRequisition,
    bulkImport,
    filterRequisitions,
    getDashboardMetrics,
    getUniqueValues,
    reloadRequisitions: loadRequisitions
  };
}