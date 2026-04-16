import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Database, Package, Tag, Hash, DollarSign, Users, RefreshCw, Filter, X
} from 'lucide-react';
import { useProductCatalog } from '../../hooks/useProductCatalog';
import { useDebounce } from '../../hooks/useDebounce';
import { CatalogMetricsCards } from './CatalogMetricsCards';
import { ProductDetailModal } from './ProductDetailModal';
import { ProductFormModal } from './ProductFormModal';
import { MigrationModal } from './MigrationModal';
import { ProductCatalog, CatalogFilterState } from '../../types';
import { CURRENCY_SYMBOLS } from '../../utils/constants';

interface CatalogViewProps {
  isDarkMode?: boolean;
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

export function CatalogView({ isDarkMode = false }: CatalogViewProps) {
  const {
    products,
    loading,
    error,
    loadProducts,
    getProductDetail,
    addProduct,
    updateProduct,
    deleteProduct,
    addPriceHistory,
    migrateFromExistingData,
    filterProducts,
    getMetrics,
    getUniqueCategories
  } = useProductCatalog();

  const [searchInput, setSearchInput] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductCatalog | null>(null);
  const [migrationOpen, setMigrationOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    const filters: CatalogFilterState = {
      descricaoSearch: debouncedSearch,
      categoriaFilter,
      fornecedorFilter: ''
    };
    filterProducts(filters);
  }, [debouncedSearch, categoriaFilter]);

  const handleViewDetail = async (product: ProductCatalog) => {
    setLoadingDetail(true);
    setDetailOpen(true);
    try {
      const detail = await getProductDetail(product.id);
      setSelectedProduct(detail || product);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddManualPrice = async (productId: string, data: { valor: number; moeda: string; fornecedorNome: string; observacoes: string }) => {
    await addPriceHistory({
      productCatalogId: productId,
      valor: data.valor,
      moeda: data.moeda,
      fornecedorNome: data.fornecedorNome,
      origem: 'Manual',
      observacoes: data.observacoes
    });
    const updated = await getProductDetail(productId);
    if (updated) setSelectedProduct(updated);
    await loadProducts();
  };

  const handleSaveProduct = async (data: any) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else {
      await addProduct(data);
    }
    setEditingProduct(null);
  };

  const handleEditProduct = (product: ProductCatalog, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleDeleteProduct = async (product: ProductCatalog, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Excluir "${product.descricao}" do catalogo? O historico de precos sera removido permanentemente.`)) return;
    await deleteProduct(product.id);
  };

  const metrics = getMetrics();
  const categories = getUniqueCategories();

  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const textMuted = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBase = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500';
  const cardBg = isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:border-blue-300';
  const cardHover = isDarkMode ? 'hover:bg-gray-750' : 'hover:shadow-md';

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Package className={`h-12 w-12 ${textMuted}`} />
        <p className={`text-sm ${textMuted}`}>Erro ao carregar catalogo: {error}</p>
        <button
          onClick={() => loadProducts()}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CatalogMetricsCards metrics={metrics} isDarkMode={isDarkMode} />

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${textMuted}`} />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Buscar por descricao..."
              className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${inputBase}`}
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted} hover:text-gray-600`}>
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <Filter className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${textMuted}`} />
            <select
              value={categoriaFilter}
              onChange={e => setCategoriaFilter(e.target.value)}
              className={`pl-9 pr-8 py-2.5 text-sm border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none ${inputBase}`}
            >
              <option value="">Todas as categorias</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMigrationOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-teal-400 hover:bg-gray-700'
                : 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
            }`}
          >
            <Database className="h-4 w-4" />
            Migrar Dados
          </button>
          <button
            onClick={() => { setEditingProduct(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className={`text-sm ${textMuted}`}>Carregando catalogo...</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Package className={`h-16 w-16 ${textMuted}`} />
          <div className="text-center">
            <p className={`text-base font-medium ${textPrimary}`}>
              {searchInput || categoriaFilter ? 'Nenhum produto encontrado' : 'Catalogo vazio'}
            </p>
            <p className={`text-sm mt-1 ${textMuted}`}>
              {searchInput || categoriaFilter
                ? 'Tente ajustar os filtros de busca'
                : 'Clique em "Migrar Dados" para importar produtos das POs existentes ou adicione manualmente.'
              }
            </p>
          </div>
          {!searchInput && !categoriaFilter && (
            <button
              onClick={() => setMigrationOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            >
              <Database className="h-4 w-4" /> Migrar Dados Existentes
            </button>
          )}
        </div>
      ) : (
        <>
          <p className={`text-xs ${textMuted}`}>{products.length} produto(s) encontrado(s)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(product => (
              <div
                key={product.id}
                onClick={() => handleViewDetail(product)}
                className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${cardBg} ${cardHover}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    {product.supplierCount !== undefined && product.supplierCount > 0 && (
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Users className="h-3 w-3" /> {product.supplierCount}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className={`text-sm font-semibold ${textPrimary} line-clamp-2 mb-2 leading-snug`}>
                  {product.descricao}
                </h3>

                <div className="space-y-1 mb-3">
                  {product.codigo && (
                    <div className={`flex items-center gap-1.5 text-xs ${textMuted}`}>
                      <Hash className="h-3 w-3" /> {product.codigo}
                    </div>
                  )}
                  {product.categoria && (
                    <div className={`flex items-center gap-1.5 text-xs ${textMuted}`}>
                      <Tag className="h-3 w-3" /> {product.categoria}
                    </div>
                  )}
                </div>

                {product.lastPrice ? (
                  <div className={`rounded-lg p-2.5 mt-auto ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <DollarSign className={`h-3.5 w-3.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                        <span className={`text-xs font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                          {formatCurrency(product.lastPrice.valor, product.lastPrice.moeda)}
                        </span>
                      </div>
                      <span className={`text-xs ${textMuted}`}>{formatDate(product.lastPrice.dataReferencia)}</span>
                    </div>
                    {product.lastPrice.fornecedorNome && (
                      <p className={`text-xs mt-1 truncate ${textMuted}`}>{product.lastPrice.fornecedorNome}</p>
                    )}
                  </div>
                ) : (
                  <div className={`rounded-lg p-2.5 mt-auto ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-xs ${textMuted}`}>Sem historico de preco</p>
                  </div>
                )}

                <div className="flex gap-2 mt-3 pt-3 border-t border-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ borderColor: isDarkMode ? 'rgba(75,85,99,0.5)' : 'rgba(229,231,235,0.8)' }}
                >
                  <button
                    onClick={e => handleEditProduct(product, e)}
                    className={`flex-1 text-xs py-1 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
                  >
                    Editar
                  </button>
                  <button
                    onClick={e => handleDeleteProduct(product, e)}
                    className="flex-1 text-xs py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ProductDetailModal
        isOpen={detailOpen && !loadingDetail}
        onClose={() => { setDetailOpen(false); setSelectedProduct(null); }}
        product={selectedProduct}
        isDarkMode={isDarkMode}
        onAddManualPrice={handleAddManualPrice}
      />

      {detailOpen && loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" />
          <div className={`relative rounded-2xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className={`text-sm ${textMuted}`}>Carregando detalhes...</p>
            </div>
          </div>
        </div>
      )}

      <ProductFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingProduct(null); }}
        onSave={handleSaveProduct}
        product={editingProduct}
        isDarkMode={isDarkMode}
        categories={categories}
      />

      <MigrationModal
        isOpen={migrationOpen}
        onClose={() => setMigrationOpen(false)}
        onMigrate={migrateFromExistingData}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
