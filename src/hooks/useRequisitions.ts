import { useState, useEffect } from 'react';
import { Requisition, FilterState, DashboardMetrics } from '../types';
import { useLocalStorage } from './useLocalStorage';

export function useRequisitions() {
  const [requisitions, setRequisitions] = useLocalStorage<Requisition[]>('requisitions', []);
  const [filteredRequisitions, setFilteredRequisitions] = useState<Requisition[]>(requisitions);

  const addRequisition = (requisition: Omit<Requisition, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRequisition: Requisition = {
      ...requisition,
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setRequisitions([newRequisition, ...requisitions]);
  };

  const updateRequisition = (id: string, updates: Partial<Requisition>) => {
    setRequisitions(requisitions.map(req => 
      req.id === id 
        ? { ...req, ...updates, updatedAt: new Date().toISOString() }
        : req
    ));
  };

  const deleteRequisition = (id: string) => {
    setRequisitions(requisitions.filter(req => req.id !== id));
  };

  const bulkImport = (newRequisitions: Requisition[]) => {
    setRequisitions([...newRequisitions, ...requisitions]);
  };

  const filterRequisitions = (filters: FilterState) => {
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
        req.project.toLowerCase().includes(searchLower)
      );
    }

    if (filters.statusSearch) {
      filtered = filtered.filter(req => req.status === filters.statusSearch);
    }

    setFilteredRequisitions(filtered);
  };

  const getDashboardMetrics = (): DashboardMetrics => {
    return {
      totalRequisitions: requisitions.length,
      pendingApproval: requisitions.filter(req => req.status === 'Em Aprovação').length,
      inQuotation: requisitions.filter(req => req.status === 'Em cotação').length,
      completed: requisitions.filter(req => req.status === 'Concluído').length,
      waitingForInvoice: requisitions.filter(req => req.status === 'Ag.Fatura').length,
      totalValue: requisitions.reduce((sum, req) => sum + req.invoiceValue, 0),
      urgentItems: requisitions.filter(req => req.criticality === 'Urgente').length,
    };
  };

  const getUniqueValues = () => {
    return {
      projects: [...new Set(requisitions.map(req => req.project).filter(Boolean))],
      categories: [...new Set(requisitions.map(req => req.category).filter(Boolean))],
      suppliers: [...new Set(requisitions.map(req => req.supplier).filter(Boolean))],
    };
  };

  useEffect(() => {
    setFilteredRequisitions(requisitions);
  }, [requisitions]);

  return {
    requisitions,
    filteredRequisitions,
    addRequisition,
    updateRequisition,
    deleteRequisition,
    bulkImport,
    filterRequisitions,
    getDashboardMetrics,
    getUniqueValues
  };
}