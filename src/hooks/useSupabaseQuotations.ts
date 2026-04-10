import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Quotation } from '../types';

function convertFromSupabase(row: any): Quotation {
  return {
    id: row.id,
    requisitionId: row.requisition_id,
    supplierName: row.supplier_name || '',
    value: row.value || 0,
    deliveryDays: row.delivery_days || 0,
    paymentConditions: row.payment_conditions || '',
    notes: row.notes || '',
    isWinner: row.is_winner || false,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  };
}

export function useSupabaseQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuotations = useCallback(async (requisitionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('quotations')
        .select('*')
        .eq('requisition_id', requisitionId)
        .order('created_at', { ascending: true });

      if (err) throw err;
      setQuotations((data || []).map(convertFromSupabase));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addQuotation = useCallback(async (requisitionId: string, quotation: Omit<Quotation, 'id' | 'requisitionId' | 'isWinner' | 'createdAt' | 'updatedAt'>) => {
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('quotations')
        .insert({
          requisition_id: requisitionId,
          supplier_name: quotation.supplierName,
          value: quotation.value,
          delivery_days: quotation.deliveryDays,
          payment_conditions: quotation.paymentConditions,
          notes: quotation.notes,
          is_winner: false,
        })
        .select()
        .maybeSingle();

      if (err) throw new Error(err.message || err.code || JSON.stringify(err));
      if (!data) throw new Error('Insercao nao retornou dados. Verifique a conexao e tente novamente.');
      const newQuotation = convertFromSupabase(data);
      setQuotations(prev => [...prev, newQuotation]);
      return newQuotation;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateQuotation = useCallback(async (id: string, updates: Partial<Omit<Quotation, 'id' | 'requisitionId' | 'createdAt' | 'updatedAt'>>) => {
    setError(null);
    try {
      const dbUpdates: any = {};
      if (updates.supplierName !== undefined) dbUpdates.supplier_name = updates.supplierName;
      if (updates.value !== undefined) dbUpdates.value = updates.value;
      if (updates.deliveryDays !== undefined) dbUpdates.delivery_days = updates.deliveryDays;
      if (updates.paymentConditions !== undefined) dbUpdates.payment_conditions = updates.paymentConditions;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.isWinner !== undefined) dbUpdates.is_winner = updates.isWinner;

      const { data, error: err } = await supabase
        .from('quotations')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (err) throw new Error(err.message || err.code || JSON.stringify(err));
      if (!data) throw new Error('Atualizacao nao retornou dados. Verifique a conexao e tente novamente.');
      const updated = convertFromSupabase(data);
      setQuotations(prev => prev.map(q => q.id === id ? updated : q));
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteQuotation = useCallback(async (id: string) => {
    setError(null);
    try {
      const { error: err } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id);

      if (err) throw err;
      setQuotations(prev => prev.filter(q => q.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const setWinner = useCallback(async (winnerId: string, requisitionId: string) => {
    setError(null);
    try {
      const { error: err1 } = await supabase
        .from('quotations')
        .update({ is_winner: false })
        .eq('requisition_id', requisitionId);

      if (err1) throw err1;

      const { data, error: err2 } = await supabase
        .from('quotations')
        .update({ is_winner: true })
        .eq('id', winnerId)
        .select()
        .maybeSingle();

      if (err2) throw new Error(err2.message || err2.code || JSON.stringify(err2));

      const updatedWinner = convertFromSupabase(data);
      setQuotations(prev => prev.map(q => ({
        ...q,
        isWinner: q.id === winnerId,
      })));
      return updatedWinner;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    quotations,
    loading,
    error,
    loadQuotations,
    addQuotation,
    updateQuotation,
    deleteQuotation,
    setWinner,
  };
}
