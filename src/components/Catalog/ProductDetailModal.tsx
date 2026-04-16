import React, { useState, useEffect } from 'react';
import {
  X, BookOpen, Users, BarChart2, Package, Plus, TrendingUp, TrendingDown, Minus,
  Calendar, DollarSign, Building2, FileText, Tag, Hash
} from 'lucide-react';
import { ProductCatalog, ProductPriceHistory, ProductSupplier } from '../../types';
import { CURRENCY_SYMBOLS } from '../../utils/constants';

type Tab = 'overview' | 'suppliers' | 'history';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductCatalog | null;
  isDarkMode?: boolean;
  onAddManualPrice?: (productId: string, data: { valor: number; moeda: string; fornecedorNome: string; observacoes: string }) => Promise<void>;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

function formatCurrency(valor: number, moeda: string): string {
  const symbol = CURRENCY_SYMBOLS[moeda as keyof typeof CURRENCY_SYMBOLS] || moeda;
  return `${symbol} ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PriceTrend({ history }: { history: ProductPriceHistory[] }) {
  if (history.length < 2) return null;
  const sorted = [...history].sort((a, b) => a.dataReferencia.localeCompare(b.dataReferencia));
  const last = sorted[sorted.length - 1].valor;
  const prev = sorted[sorted.length - 2].valor;
  const pct = prev > 0 ? ((last - prev) / prev) * 100 : 0;

  if (Math.abs(pct) < 0.01) return <span className="flex items-center gap-1 text-gray-500 text-xs"><Minus className="h-3 w-3" /> Estavel</span>;
  if (pct > 0) return <span className="flex items-center gap-1 text-red-500 text-xs"><TrendingUp className="h-3 w-3" /> +{pct.toFixed(1)}%</span>;
  return <span className="flex items-center gap-1 text-green-500 text-xs"><TrendingDown className="h-3 w-3" /> {pct.toFixed(1)}%</span>;
}

function AddPriceForm({ onSave, onCancel, isDarkMode }: { onSave: (data: any) => void; onCancel: () => void; isDarkMode: boolean }) {
  const [valor, setValor] = useState('');
  const [moeda, setMoeda] = useState('BRL');
  const [fornecedorNome, setFornecedorNome] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const base = isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900';
  const label = isDarkMode ? 'text-gray-300' : 'text-gray-700';

  return (
    <div className={`rounded-xl border p-4 mt-4 ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <h4 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Adicionar Preco Manual</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`block text-xs font-medium mb-1 ${label}`}>Valor *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={valor}
            onChange={e => setValor(e.target.value)}
            className={`w-full text-sm border rounded-lg px-3 py-2 ${base}`}
            placeholder="0,00"
          />
        </div>
        <div>
          <label className={`block text-xs font-medium mb-1 ${label}`}>Moeda</label>
          <select value={moeda} onChange={e => setMoeda(e.target.value)} className={`w-full text-sm border rounded-lg px-3 py-2 ${base}`}>
            {['BRL', 'USD', 'EUR', 'GBP', 'JPY', 'CNY'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={`block text-xs font-medium mb-1 ${label}`}>Fornecedor</label>
          <input
            type="text"
            value={fornecedorNome}
            onChange={e => setFornecedorNome(e.target.value)}
            className={`w-full text-sm border rounded-lg px-3 py-2 ${base}`}
            placeholder="Nome do fornecedor"
          />
        </div>
        <div>
          <label className={`block text-xs font-medium mb-1 ${label}`}>Observacoes</label>
          <input
            type="text"
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            className={`w-full text-sm border rounded-lg px-3 py-2 ${base}`}
            placeholder="Observacoes"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onCancel} className={`px-3 py-1.5 text-sm rounded-lg ${isDarkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
          Cancelar
        </button>
        <button
          onClick={() => valor && onSave({ valor: parseFloat(valor), moeda, fornecedorNome, observacoes })}
          disabled={!valor}
          className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}

export function ProductDetailModal({ isOpen, onClose, product, isDarkMode = false, onAddManualPrice }: ProductDetailModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showAddPrice, setShowAddPrice] = useState(false);

  useEffect(() => {
    if (isOpen) setActiveTab('overview');
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const bg = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const header = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const textMuted = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const tableBorder = isDarkMode ? 'divide-gray-700 border-gray-700' : 'divide-gray-200 border-gray-200';
  const rowBg = isDarkMode ? 'bg-gray-800/40' : 'bg-gray-50';
  const tabActive = isDarkMode ? 'border-blue-400 text-blue-400' : 'border-blue-600 text-blue-600';
  const tabInactive = isDarkMode ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700';

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'overview', label: 'Visao Geral', icon: BookOpen },
    { id: 'suppliers', label: 'Fornecedores', icon: Users, count: product.suppliers?.length || 0 },
    { id: 'history', label: 'Historico de Precos', icon: BarChart2, count: product.priceHistory?.length || 0 }
  ];

  const handleAddPrice = async (data: any) => {
    if (onAddManualPrice) {
      await onAddManualPrice(product.id, data);
    }
    setShowAddPrice(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${bg}`}>
        <div className={`flex items-start justify-between p-6 border-b ${header}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100'}`}>
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${textPrimary} leading-tight`}>{product.descricao}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {product.codigo && (
                  <span className={`flex items-center gap-1 text-xs ${textMuted}`}>
                    <Hash className="h-3 w-3" /> {product.codigo}
                  </span>
                )}
                {product.categoria && (
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    <Tag className="h-3 w-3" /> {product.categoria}
                  </span>
                )}
                {product.lastPrice && (
                  <span className={`flex items-center gap-1 text-xs font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                    <DollarSign className="h-3 w-3" />
                    Ultimo: {formatCurrency(product.lastPrice.valor, product.lastPrice.moeda)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} px-6`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-1 py-3 mr-6 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? tabActive : tabInactive}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Codigo', value: product.codigo || '-', icon: Hash },
                  { label: 'Categoria', value: product.categoria || '-', icon: Tag },
                  { label: 'Unidade de Medida', value: product.unidadeMedida || '-', icon: Package },
                  { label: 'NCM', value: product.ncm || '-', icon: FileText }
                ].map(field => (
                  <div key={field.label} className={`rounded-xl p-4 border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <field.icon className={`h-3.5 w-3.5 ${textMuted}`} />
                      <span className={`text-xs font-medium ${textMuted}`}>{field.label}</span>
                    </div>
                    <p className={`text-sm font-semibold ${textPrimary}`}>{field.value}</p>
                  </div>
                ))}
              </div>
              {product.observacoes && (
                <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <span className={`text-xs font-medium ${textMuted} block mb-1`}>Observacoes</span>
                  <p className={`text-sm ${textSecondary}`}>{product.observacoes}</p>
                </div>
              )}
              {product.lastPrice && (
                <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-700'} block mb-1`}>Ultimo Preco Registrado</span>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                        {formatCurrency(product.lastPrice.valor, product.lastPrice.moeda)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${textMuted}`}>{formatDate(product.lastPrice.dataReferencia)}</p>
                      {product.lastPrice.fornecedorNome && (
                        <p className={`text-xs font-medium mt-1 ${textSecondary}`}>{product.lastPrice.fornecedorNome}</p>
                      )}
                      {product.lastPrice.numeroPo && (
                        <p className={`text-xs ${textMuted}`}>PO: {product.lastPrice.numeroPo}</p>
                      )}
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                        product.lastPrice.origem === 'PO'
                          ? isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'
                          : product.lastPrice.origem === 'Cotacao'
                          ? isDarkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700'
                          : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {product.lastPrice.origem}
                      </span>
                    </div>
                  </div>
                  {product.priceHistory && product.priceHistory.length > 1 && (
                    <div className="mt-2">
                      <PriceTrend history={product.priceHistory} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div>
              {(!product.suppliers || product.suppliers.length === 0) ? (
                <div className="text-center py-12">
                  <Users className={`h-12 w-12 mx-auto mb-3 ${textMuted}`} />
                  <p className={`text-sm ${textMuted}`}>Nenhum fornecedor vinculado.</p>
                  <p className={`text-xs mt-1 ${textMuted}`}>Os fornecedores sao adicionados automaticamente ao registrar POs ou cotacoes.</p>
                </div>
              ) : (
                <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={rowBg}>
                        <th className={`text-left px-4 py-3 text-xs font-semibold ${textMuted}`}>Fornecedor</th>
                        <th className={`text-left px-4 py-3 text-xs font-semibold ${textMuted}`}>Codigo</th>
                        <th className={`text-right px-4 py-3 text-xs font-semibold ${textMuted}`}>Ultimo Preco</th>
                        <th className={`text-center px-4 py-3 text-xs font-semibold ${textMuted}`}>Status</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${tableBorder}`}>
                      {product.suppliers.map(supplier => (
                        <tr key={supplier.id} className={`${isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                          <td className={`px-4 py-3 font-medium ${textPrimary}`}>
                            <div className="flex items-center gap-2">
                              <Building2 className={`h-4 w-4 ${textMuted}`} />
                              {supplier.nomeFornecedor}
                            </div>
                          </td>
                          <td className={`px-4 py-3 ${textSecondary}`}>{supplier.codigoFornecedor || '-'}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                            {supplier.lastPrice ? formatCurrency(supplier.lastPrice.valor, supplier.lastPrice.moeda) : '-'}
                            {supplier.lastPrice && (
                              <div className={`text-xs font-normal ${textMuted}`}>{formatDate(supplier.lastPrice.dataReferencia)}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              supplier.ativo
                                ? isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'
                                : isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'
                            }`}>
                              {supplier.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-semibold ${textPrimary}`}>
                  {product.priceHistory?.length || 0} registro(s)
                </h3>
                {onAddManualPrice && (
                  <button
                    onClick={() => setShowAddPrice(!showAddPrice)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Manual
                  </button>
                )}
              </div>

              {showAddPrice && (
                <AddPriceForm onSave={handleAddPrice} onCancel={() => setShowAddPrice(false)} isDarkMode={isDarkMode} />
              )}

              {(!product.priceHistory || product.priceHistory.length === 0) ? (
                <div className="text-center py-12">
                  <BarChart2 className={`h-12 w-12 mx-auto mb-3 ${textMuted}`} />
                  <p className={`text-sm ${textMuted}`}>Nenhum historico de preco disponivel.</p>
                  <p className={`text-xs mt-1 ${textMuted}`}>Execute a migracao de dados ou adicione um preco manualmente.</p>
                </div>
              ) : (
                <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={rowBg}>
                        <th className={`text-left px-4 py-3 text-xs font-semibold ${textMuted}`}>Data</th>
                        <th className={`text-right px-4 py-3 text-xs font-semibold ${textMuted}`}>Valor</th>
                        <th className={`text-left px-4 py-3 text-xs font-semibold ${textMuted}`}>Fornecedor</th>
                        <th className={`text-left px-4 py-3 text-xs font-semibold ${textMuted}`}>PO / Origem</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${tableBorder}`}>
                      {product.priceHistory.map((entry, idx) => {
                        const prevEntry = product.priceHistory![idx + 1];
                        const pctChange = prevEntry && prevEntry.valor > 0
                          ? ((entry.valor - prevEntry.valor) / prevEntry.valor) * 100
                          : null;

                        return (
                          <tr key={entry.id} className={`${isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                            <td className={`px-4 py-3 ${textSecondary}`}>
                              <div className="flex items-center gap-1.5">
                                <Calendar className={`h-3.5 w-3.5 ${textMuted}`} />
                                {formatDate(entry.dataReferencia)}
                              </div>
                            </td>
                            <td className={`px-4 py-3 text-right`}>
                              <span className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                                {formatCurrency(entry.valor, entry.moeda)}
                              </span>
                              {pctChange !== null && (
                                <div className={`text-xs ${pctChange > 0 ? 'text-red-500' : pctChange < 0 ? 'text-green-500' : textMuted}`}>
                                  {pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}%
                                </div>
                              )}
                            </td>
                            <td className={`px-4 py-3 ${textSecondary}`}>
                              {entry.fornecedorNome || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {entry.numeroPo && (
                                  <span className={`text-xs ${textMuted}`}>PO: {entry.numeroPo}</span>
                                )}
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  entry.origem === 'PO'
                                    ? isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'
                                    : entry.origem === 'Cotacao'
                                    ? isDarkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700'
                                    : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {entry.origem}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
