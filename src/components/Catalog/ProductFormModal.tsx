import React, { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';
import { ProductCatalog } from '../../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ProductCatalog, 'id' | 'createdAt' | 'updatedAt' | 'suppliers' | 'priceHistory' | 'lastPrice' | 'supplierCount'>) => Promise<void>;
  product?: ProductCatalog | null;
  isDarkMode?: boolean;
  categories?: string[];
}

export function ProductFormModal({ isOpen, onClose, onSave, product, isDarkMode = false, categories = [] }: ProductFormModalProps) {
  const [descricao, setDescricao] = useState('');
  const [codigo, setCodigo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState('');
  const [ncm, setNcm] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setDescricao(product.descricao);
      setCodigo(product.codigo || '');
      setCategoria(product.categoria || '');
      setUnidadeMedida(product.unidadeMedida || '');
      setNcm(product.ncm || '');
      setObservacoes(product.observacoes || '');
    } else if (isOpen && !product) {
      setDescricao('');
      setCodigo('');
      setCategoria('');
      setUnidadeMedida('');
      setNcm('');
      setObservacoes('');
    }
  }, [isOpen, product]);

  if (!isOpen) return null;

  const base = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500';
  const label = isDarkMode ? 'text-gray-300' : 'text-gray-700';
  const bg = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const header = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
  const footer = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';

  const handleSave = async () => {
    if (!descricao.trim()) return;
    setSaving(true);
    try {
      await onSave({ descricao: descricao.trim(), codigo, categoria, unidadeMedida, ncm, observacoes });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden ${bg}`}>
        <div className={`flex items-center justify-between p-6 border-b ${header}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100'}`}>
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {product ? 'Editar Produto' : 'Novo Produto'}
            </h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${label}`}>Descricao *</label>
            <input
              type="text"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-colors ${base}`}
              placeholder="Descricao do produto"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${label}`}>Codigo</label>
              <input
                type="text"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-colors ${base}`}
                placeholder="COD-001"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${label}`}>Categoria</label>
              <input
                type="text"
                list="categories-list"
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-colors ${base}`}
                placeholder="Ex: Eletrico, Mecanico"
              />
              <datalist id="categories-list">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${label}`}>Unidade de Medida</label>
              <input
                type="text"
                value={unidadeMedida}
                onChange={e => setUnidadeMedida(e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-colors ${base}`}
                placeholder="UN, KG, M, L..."
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${label}`}>NCM</label>
              <input
                type="text"
                value={ncm}
                onChange={e => setNcm(e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-colors ${base}`}
                placeholder="0000.00.00"
              />
            </div>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${label}`}>Observacoes</label>
            <textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              rows={3}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-colors resize-none ${base}`}
              placeholder="Observacoes adicionais"
            />
          </div>
        </div>

        <div className={`flex justify-end gap-3 p-6 border-t ${footer}`}>
          <button onClick={onClose} className={`px-4 py-2 text-sm font-medium rounded-xl ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!descricao.trim() || saving}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
