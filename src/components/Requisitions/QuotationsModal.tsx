import React, { useState, useEffect } from 'react';
import { X, Plus, Trophy, Trash2, Save, CreditCard as Edit2, Check, AlertCircle, Loader } from 'lucide-react';
import { Quotation, Requisition } from '../../types';
import { useSupabaseQuotations } from '../../hooks/useSupabaseQuotations';
import { formatCurrency } from '../../utils/formatters';

interface QuotationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: Requisition | null;
}

interface QuotationFormData {
  supplierName: string;
  value: string;
  deliveryDays: string;
  paymentConditions: string;
  notes: string;
}

const emptyForm: QuotationFormData = {
  supplierName: '',
  value: '',
  deliveryDays: '',
  paymentConditions: '',
  notes: '',
};

function QuotationCard({
  quotation,
  isLowest,
  onSetWinner,
  onEdit,
  onDelete,
  settingWinner,
}: {
  quotation: Quotation;
  isLowest: boolean;
  onSetWinner: () => void;
  onEdit: () => void;
  onDelete: () => void;
  settingWinner: boolean;
}) {
  return (
    <div
      className={`relative rounded-xl border-2 p-5 transition-all ${
        quotation.isWinner
          ? 'border-amber-400 bg-amber-50 shadow-md'
          : isLowest && !quotation.isWinner
          ? 'border-green-200 bg-green-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      {quotation.isWinner && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow">
            <Trophy className="h-3 w-3" />
            CAMPEAO
          </span>
        </div>
      )}

      {isLowest && !quotation.isWinner && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
            Menor Preco
          </span>
        </div>
      )}

      <div className="mt-2 mb-4">
        <h3 className={`text-base font-bold truncate ${quotation.isWinner ? 'text-amber-900' : 'text-gray-900'}`}>
          {quotation.supplierName || 'Fornecedor sem nome'}
        </h3>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Valor</span>
          <span className={`font-semibold ${quotation.isWinner ? 'text-amber-800' : 'text-gray-900'}`}>
            {quotation.value > 0 ? formatCurrency(quotation.value) : '-'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Prazo</span>
          <span className="font-medium text-gray-900">
            {quotation.deliveryDays > 0 ? `${quotation.deliveryDays} dias` : '-'}
          </span>
        </div>
        {quotation.paymentConditions && (
          <div className="flex justify-between items-start gap-2">
            <span className="text-gray-500 shrink-0">Pagamento</span>
            <span className="font-medium text-gray-900 text-right">{quotation.paymentConditions}</span>
          </div>
        )}
        {quotation.notes && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-gray-500 text-xs leading-relaxed">{quotation.notes}</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
        {!quotation.isWinner && (
          <button
            onClick={onSetWinner}
            disabled={settingWinner}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors disabled:opacity-50"
          >
            {settingWinner ? (
              <Loader className="h-3 w-3 animate-spin" />
            ) : (
              <Trophy className="h-3 w-3" />
            )}
            Definir Campeao
          </button>
        )}
        {quotation.isWinner && (
          <div className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-amber-200 text-amber-800">
            <Check className="h-3 w-3" />
            Campeao
          </div>
        )}
        <button
          onClick={onEdit}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="Editar"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Excluir"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function QuotationForm({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  title,
}: {
  form: QuotationFormData;
  onChange: (field: keyof QuotationFormData, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  title: string;
}) {
  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
      <h4 className="text-sm font-semibold text-blue-900 mb-4">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Fornecedor *</label>
          <input
            type="text"
            value={form.supplierName}
            onChange={e => onChange('supplierName', e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Fornecedor ABC Ltda"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
          <input
            type="number"
            value={form.value}
            onChange={e => onChange('value', e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0,00"
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Prazo de Entrega (dias)</label>
          <input
            type="number"
            value={form.deliveryDays}
            onChange={e => onChange('deliveryDays', e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 15"
            min="0"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Condicoes de Pagamento</label>
          <input
            type="text"
            value={form.paymentConditions}
            onChange={e => onChange('paymentConditions', e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 30/60/90 dias"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Observacoes</label>
          <textarea
            value={form.notes}
            onChange={e => onChange('notes', e.target.value)}
            rows={2}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Observacoes adicionais..."
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onSave}
          disabled={saving || !form.supplierName.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
      </div>
    </div>
  );
}

export function QuotationsModal({ isOpen, onClose, requisition }: QuotationsModalProps) {
  const { quotations, loading, error, loadQuotations, addQuotation, updateQuotation, deleteQuotation, setWinner } = useSupabaseQuotations();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<QuotationFormData>(emptyForm);
  const [editForm, setEditForm] = useState<QuotationFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [settingWinner, setSettingWinner] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && requisition) {
      loadQuotations(requisition.id);
      setShowAddForm(false);
      setEditingId(null);
    }
  }, [isOpen, requisition, loadQuotations]);

  if (!isOpen || !requisition) return null;

  const lowestValueId = quotations.length > 1
    ? quotations.reduce((min, q) => q.value > 0 && (min === null || q.value < quotations.find(x => x.id === min)!.value) ? q.id : min, null as string | null)
    : null;

  function handleAddChange(field: keyof QuotationFormData, value: string) {
    setAddForm(prev => ({ ...prev, [field]: value }));
  }

  function handleEditChange(field: keyof QuotationFormData, value: string) {
    setEditForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleAddSave() {
    setSaving(true);
    try {
      await addQuotation(requisition!.id, {
        supplierName: addForm.supplierName.trim(),
        value: parseFloat(addForm.value) || 0,
        deliveryDays: parseInt(addForm.deliveryDays) || 0,
        paymentConditions: addForm.paymentConditions.trim(),
        notes: addForm.notes.trim(),
      });
      setAddForm(emptyForm);
      setShowAddForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave() {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateQuotation(editingId, {
        supplierName: editForm.supplierName.trim(),
        value: parseFloat(editForm.value) || 0,
        deliveryDays: parseInt(editForm.deliveryDays) || 0,
        paymentConditions: editForm.paymentConditions.trim(),
        notes: editForm.notes.trim(),
      });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  function handleStartEdit(q: Quotation) {
    setEditingId(q.id);
    setEditForm({
      supplierName: q.supplierName,
      value: q.value > 0 ? String(q.value) : '',
      deliveryDays: q.deliveryDays > 0 ? String(q.deliveryDays) : '',
      paymentConditions: q.paymentConditions,
      notes: q.notes,
    });
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteQuotation(id);
    } finally {
      setDeleting(null);
    }
  }

  async function handleSetWinner(q: Quotation) {
    setSettingWinner(true);
    try {
      await setWinner(q.id, requisition!.id);
    } finally {
      setSettingWinner(false);
    }
  }

  const winner = quotations.find(q => q.isWinner);
  const canAddMore = quotations.length < 5;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-gray-50 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-amber-100 rounded-lg">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Cotacoes — RC {requisition.rc}
              </h2>
              <p className="text-sm text-gray-500">{requisition.item}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Summary bar when winner is set */}
        {winner && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 shrink-0">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <Trophy className="h-4 w-4 text-amber-600" />
              <span className="font-semibold">Campeao selecionado:</span>
              <span>{winner.supplierName}</span>
              {winner.value > 0 && (
                <>
                  <span className="text-amber-400">|</span>
                  <span className="font-semibold">{formatCurrency(winner.value)}</span>
                </>
              )}
              {winner.deliveryDays > 0 && (
                <>
                  <span className="text-amber-400">|</span>
                  <span>{winner.deliveryDays} dias</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Carregando cotacoes...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Cards */}
              {quotations.length > 0 && (
                <div className={`grid gap-5 ${quotations.length === 1 ? 'grid-cols-1 max-w-sm' : quotations.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {quotations.map(q =>
                    editingId === q.id ? (
                      <div key={q.id} className="sm:col-span-2 lg:col-span-3">
                        <QuotationForm
                          title={`Editando: ${q.supplierName}`}
                          form={editForm}
                          onChange={handleEditChange}
                          onSave={handleEditSave}
                          onCancel={() => setEditingId(null)}
                          saving={saving}
                        />
                      </div>
                    ) : (
                      <QuotationCard
                        key={q.id}
                        quotation={q}
                        isLowest={q.id === lowestValueId}
                        onSetWinner={() => handleSetWinner(q)}
                        onEdit={() => handleStartEdit(q)}
                        onDelete={() => handleDelete(q.id)}
                        settingWinner={settingWinner && deleting !== q.id}
                      />
                    )
                  )}
                </div>
              )}

              {/* Empty state */}
              {quotations.length === 0 && !showAddForm && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Trophy className="h-12 w-12 mb-3 text-gray-300" />
                  <p className="text-sm font-medium text-gray-500">Nenhuma cotacao registrada</p>
                  <p className="text-xs text-gray-400 mt-1">Adicione os fornecedores que participaram da cotacao</p>
                </div>
              )}

              {/* Add form */}
              {showAddForm && (
                <QuotationForm
                  title="Novo Fornecedor"
                  form={addForm}
                  onChange={handleAddChange}
                  onSave={handleAddSave}
                  onCancel={() => { setShowAddForm(false); setAddForm(emptyForm); }}
                  saving={saving}
                />
              )}

              {/* Add button */}
              {canAddMore && !showAddForm && editingId === null && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Fornecedor ({quotations.length}/5)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-between items-center shrink-0">
          <p className="text-xs text-gray-400">
            {quotations.length} fornecedor{quotations.length !== 1 ? 'es' : ''} registrado{quotations.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
