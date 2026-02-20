import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { Header } from './components/Layout/Header';
import { MetricsCards } from './components/Dashboard/MetricsCards';
import { RecentActivity } from './components/Dashboard/RecentActivity';
import { RequisitionsTable } from './components/Requisitions/RequisitionsTable';
import { RequisitionForm } from './components/Requisitions/RequisitionForm';
import { RequisitionDetailModal } from './components/Requisitions/RequisitionDetailModal';
import { RequisitionProductsModal } from './components/Requisitions/RequisitionProductsModal';
import { FiltersModal } from './components/FiltersModal';
import { BulkImportModal } from './components/BulkImportModal';
import { PurchaseOrderItemsTable } from './components/PurchaseOrders/PurchaseOrderItemsTable';
import { PurchaseOrderItemForm } from './components/PurchaseOrders/PurchaseOrderItemForm';
import { PurchaseOrderItemDetailModal } from './components/PurchaseOrders/PurchaseOrderItemDetailModal';
import { ProductMetricsCards } from './components/PurchaseOrders/ProductMetricsCards';
import { BulkImportProductsModal } from './components/PurchaseOrders/BulkImportProductsModal';
import { useSupabaseRequisitions } from './hooks/useSupabaseRequisitions';
import { useSupabasePurchaseOrders } from './hooks/useSupabasePurchaseOrders';
import { FilterState, Requisition, RequisitionStatus, PurchaseOrderItem, PurchaseOrderFilterState } from './types';
import { REQUISITION_STATUSES } from './utils/constants';
import { parseCSVData } from './utils/csvParser';
import { exportToCSV, exportToExcel } from './utils/excelExporter';
import { parseProductCSVData } from './utils/productCsvParser';
import { exportProductsToCSV, exportProductsToExcel } from './utils/productExporter';
import { migrateLocalStorageToSupabase, checkIfMigrationNeeded } from './utils/migrateLocalStorageToSupabase';
import { supabase } from './lib/supabase';

// Hook para gerenciar tema dark/claro
function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return { isDarkMode, toggleTheme };
}

function App() {
  const { isDarkMode, toggleTheme } = useTheme();
  const {
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
    reloadRequisitions
  } = useSupabaseRequisitions();

  const {
    items: purchaseOrderItems,
    filteredItems: filteredPurchaseOrderItems,
    upcomingDeliveries: upcomingProductDeliveries,
    loading: loadingProducts,
    error: errorProducts,
    addItem: addPurchaseOrderItem,
    updateItem: updatePurchaseOrderItem,
    deleteItem: deletePurchaseOrderItem,
    bulkImport: bulkImportProducts,
    filterItems: filterPurchaseOrderItems,
    getMetrics: getProductMetrics,
    getUniqueValues: getProductUniqueValues,
    reloadItems: reloadProducts
  } = useSupabasePurchaseOrders();

  const [currentView, setCurrentView] = useState<'dashboard' | 'requisitions' | 'products'>('dashboard');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [selectedRequisitionForDetail, setSelectedRequisitionForDetail] = useState<Requisition | null>(null);
  const [productsModalOpen, setProductsModalOpen] = useState(false);
  const [selectedRequisitionForProducts, setSelectedRequisitionForProducts] = useState<Requisition | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    rcSearch: '',
    projectSearch: '',
    statusSearch: '',
    freightFilter: 'all',
    attentionFilter: 'all'
  });

  const [productFormOpen, setProductFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PurchaseOrderItem | null>(null);
  const [productDetailModalOpen, setProductDetailModalOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<PurchaseOrderItem | null>(null);
  const [productFilters, setProductFilters] = useState<PurchaseOrderFilterState>({
    poSearch: '',
    itemCodeSearch: '',
    itemDescriptionSearch: '',
    statusSearch: '',
    currencyFilter: 'all',
    deliveryFilter: 'all'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    inProgress: boolean;
    message: string;
    type: 'info' | 'success' | 'error';
  }>({ inProgress: false, message: '', type: 'info' });

  const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false);
  const [bulkImportProductsModalOpen, setBulkImportProductsModalOpen] = useState(false);

  // Verificar se há dados no localStorage que precisam ser migrados
  useEffect(() => {
    const migrationCheck = checkIfMigrationNeeded();
    if (migrationCheck.needed && !loading) {
      console.log('🔔 Dados encontrados no localStorage:', migrationCheck);
      setShowMigrationModal(true);
    }
  }, [loading]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    filterRequisitions(newFilters);
  };

  const handleNewRequisition = () => {
    setSelectedRequisition(null);
    setFormOpen(true);
  };

  const handleEditRequisition = (requisition: Requisition) => {
    setSelectedRequisition(requisition);
    setFormOpen(true);
  };

  const handleViewDetails = (requisition: Requisition) => {
    setSelectedRequisitionForDetail(requisition);
    setDetailModalOpen(true);
  };

  const handleViewProducts = (requisition: Requisition) => {
    setSelectedRequisitionForProducts(requisition);
    setProductsModalOpen(true);
  };

  const handleSaveRequisition = (requisitionData: Omit<Requisition, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedRequisition) {
      updateRequisition(selectedRequisition.id, requisitionData);
    } else {
      addRequisition(requisitionData);
    }
  };

  const handleDeleteRequisition = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta requisição?')) {
      deleteRequisition(id);
    }
  };

  const handleImport = () => {
    setBulkImportModalOpen(true);
  };

  const handleBulkImportComplete = () => {
    reloadRequisitions();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvData = e.target?.result as string;
        const processImport = async () => {
          try {
            console.log('Iniciando importação...');
            console.log('Dados CSV recebidos:', csvData.substring(0, 200) + '...');
            
            const parsedRequisitions = parseCSVData(csvData);
            console.log('Requisições parseadas:', parsedRequisitions);
            
            await bulkImport(parsedRequisitions);
            alert(`✅ ${parsedRequisitions.length} requisição(ões) importada(s) com sucesso!`);
          } catch (error) {
            console.error('Erro na importação:', error);
            alert(`❌ Erro ao importar arquivo CSV: ${error instanceof Error ? error.message : 'Verifique o formato do arquivo'}`);
          }
        };
        
        processImport();
      };
      reader.readAsText(file);
      // Limpar o input para permitir reimportar o mesmo arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = () => {
    const csvData = exportToCSV(filteredRequisitions);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `requisicoes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportCSV = () => {
    const csvData = exportToCSV(filteredRequisitions);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `requisicoes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(filteredRequisitions);
  };

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setProductFormOpen(true);
  };

  const handleEditProduct = (product: PurchaseOrderItem) => {
    setSelectedProduct(product);
    setProductFormOpen(true);
  };

  const handleViewProductDetails = (product: PurchaseOrderItem) => {
    setSelectedProductForDetail(product);
    setProductDetailModalOpen(true);
  };

  const handleSaveProduct = (productData: Omit<PurchaseOrderItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedProduct) {
      updatePurchaseOrderItem(selectedProduct.id, productData);
    } else {
      addPurchaseOrderItem(productData);
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      deletePurchaseOrderItem(id);
    }
  };

  const handleImportProducts = () => {
    setBulkImportProductsModalOpen(true);
  };

  const handleBulkImportProductsComplete = () => {
    reloadProducts();
  };

  const handleProductFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvData = e.target?.result as string;
        const processImport = async () => {
          try {
            console.log('Iniciando importação de produtos...');
            const parsedProducts = parseProductCSVData(csvData);
            console.log('Produtos parseados:', parsedProducts);

            await bulkImportProducts(parsedProducts);
            alert(`✅ ${parsedProducts.length} produto(s) importado(s) com sucesso!`);
          } catch (error) {
            console.error('Erro na importação:', error);
            alert(`❌ Erro ao importar arquivo CSV: ${error instanceof Error ? error.message : 'Verifique o formato do arquivo'}`);
          }
        };

        processImport();
      };
      reader.readAsText(file);
      if (productFileInputRef.current) {
        productFileInputRef.current.value = '';
      }
    }
  };

  const handleExportProductsCSV = () => {
    const csvData = exportProductsToCSV(filteredPurchaseOrderItems);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `produtos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportProductsExcel = () => {
    exportProductsToExcel(filteredPurchaseOrderItems);
  };

  const handleProductFiltersChange = (newFilters: PurchaseOrderFilterState) => {
    setProductFilters(newFilters);
    filterPurchaseOrderItems(newFilters);
  };

  const handleMigration = async () => {
    setMigrationStatus({ inProgress: true, message: 'Migrando dados...', type: 'info' });

    try {
      const result = await migrateLocalStorageToSupabase();

      if (result.success) {
        setMigrationStatus({
          inProgress: false,
          message: result.message,
          type: 'success'
        });

        // Recarregar dados do Supabase
        await reloadRequisitions();
        await reloadProducts();

        // Fechar modal após 2 segundos
        setTimeout(() => {
          setShowMigrationModal(false);
        }, 2000);
      } else {
        setMigrationStatus({
          inProgress: false,
          message: result.message,
          type: 'error'
        });
      }
    } catch (error) {
      setMigrationStatus({
        inProgress: false,
        message: 'Erro ao migrar dados. Tente novamente.',
        type: 'error'
      });
    }
  };

  const handleClearAllData = async () => {
    // Deletar todas as requisições
    const { error: requisitionsError } = await supabase
      .from('requisitions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (requisitionsError) {
      throw new Error(`Erro ao deletar requisições: ${requisitionsError.message}`);
    }

    // Deletar todos os itens de pedido
    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (itemsError) {
      throw new Error(`Erro ao deletar itens de pedido: ${itemsError.message}`);
    }

    // Recarregar dados
    await reloadRequisitions();
    await reloadProducts();
  };

  const metrics = getDashboardMetrics();
  const uniqueValues = getUniqueValues();
  const productMetrics = getProductMetrics();
  const productUniqueValues = getProductUniqueValues();

  // Mostrar loading enquanto carrega dados do Supabase
  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center transition-colors duration-200`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} transition-colors duration-200`}>
            Carregando dados do Supabase...
          </p>
        </div>
      </div>
    );
  }

  // Mostrar erro se houver problema na conexão
  if (error) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center transition-colors duration-200`}>
        <div className="text-center max-w-md">
          <div className={`${isDarkMode ? 'bg-red-900/20 border-red-600 text-red-400' : 'bg-red-100 border-red-400 text-red-700'} px-4 py-3 rounded mb-4 border transition-colors duration-200`}>
            <strong className="font-bold">Erro de Conexão!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button
            onClick={reloadRequisitions}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Tentar Novamente
          </button>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-4 transition-colors duration-200`}>
            Verifique se o Supabase está configurado corretamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <Header
        onNewRequisition={currentView === 'products' ? handleNewProduct : handleNewRequisition}
        onImport={currentView === 'products' ? handleImportProducts : handleImport}
        onExportCSV={currentView === 'products' ? handleExportProductsCSV : handleExportCSV}
        onExportExcel={currentView === 'products' ? handleExportProductsExcel : handleExportExcel}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onClearAllData={handleClearAllData}
      />

      <main className="w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
          <div className="max-w-7xl mx-auto">
            {/* Navigation */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
              <nav className={`flex space-x-8 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} transition-colors duration-200`}>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`text-sm font-medium border-b-2 pb-3 transition-all duration-200 ${
                    currentView === 'dashboard'
                      ? 'text-blue-600 border-blue-600'
                      : `${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} border-transparent hover:border-gray-300`
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('requisitions')}
                  className={`text-sm font-medium border-b-2 pb-3 transition-all duration-200 ${
                    currentView === 'requisitions'
                      ? 'text-blue-600 border-blue-600'
                      : `${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} border-transparent hover:border-gray-300`
                  }`}
                >
                  Requisições ({filteredRequisitions.length})
                </button>
                <button
                  onClick={() => setCurrentView('products')}
                  className={`text-sm font-medium border-b-2 pb-3 transition-all duration-200 ${
                    currentView === 'products'
                      ? 'text-blue-600 border-blue-600'
                      : `${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} border-transparent hover:border-gray-300`
                  }`}
                >
                  Produtos ({filteredPurchaseOrderItems.length})
                </button>
              </nav>

              {/* Search Filters */}
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 items-end">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} transition-colors duration-200`} />
                  <input
                    type="text"
                    placeholder="Buscar por RC..."
                    value={filters.rcSearch}
                    onChange={(e) => handleFiltersChange({ ...filters, rcSearch: e.target.value })}
                    className={`pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-48 transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} transition-colors duration-200`} />
                  <input
                    type="text"
                    placeholder="Buscar projeto ou item..."
                    value={filters.projectSearch}
                    onChange={(e) => handleFiltersChange({ ...filters, projectSearch: e.target.value })}
                    list="projects-main"
                    className={`pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <datalist id="projects-main">
                    {uniqueValues.projects.map(project => (
                      <option key={project} value={project} />
                    ))}
                  </datalist>
                </div>
                
                {/* Botão de Filtros Avançados */}
                <button
                  onClick={() => setFiltersModalOpen(true)}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 relative ${
                    isDarkMode
                      ? 'text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700'
                      : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {/* Indicador de filtros ativos */}
                  {(() => {
                    const activeCount = Object.entries(filters).filter(([key, value]) => {
                      if (key === 'rcSearch' || key === 'projectSearch') return false;
                      if (key === 'freightFilter' || key === 'attentionFilter') {
                        return value !== 'all';
                      }
                      return value !== '';
                    }).length;
                    
                    return activeCount > 0 ? (
                      <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-medium">
                        {activeCount}
                      </span>
                    ) : null;
                  })()}
                </button>
              </div>
            </div>


            {/* Content */}
            <div className="w-full space-y-6">
              {currentView === 'dashboard' ? (
                <div className="space-y-6">
                  <MetricsCards metrics={metrics} isDarkMode={isDarkMode} />
                  <RecentActivity requisitions={filteredRequisitions} isDarkMode={isDarkMode} />
                </div>
              ) : currentView === 'requisitions' ? (
                <RequisitionsTable
                  requisitions={filteredRequisitions}
                  upcomingDeliveries={upcomingDeliveries}
                  onEdit={handleEditRequisition}
                  onViewDetails={handleViewDetails}
                  onViewProducts={handleViewProducts}
                  onDelete={handleDeleteRequisition}
                  onUpdate={(id, field, value) => updateRequisition(id, { [field]: value })}
                  isDarkMode={isDarkMode}
                />
              ) : (
                <div className="space-y-6">
                  {/* Debug: Mostrar métricas para verificar valores */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">Debug - Métricas dos Produtos:</h4>
                      <pre className="text-xs text-yellow-700">
                        {JSON.stringify(productMetrics, null, 2)}
                      </pre>
                      <p className="text-xs text-yellow-600 mt-2">
                        Total de itens carregados: {filteredPurchaseOrderItems.length}
                      </p>
                    </div>
                  )}
                  <ProductMetricsCards metrics={productMetrics} isDarkMode={isDarkMode} />
                  <PurchaseOrderItemsTable
                    items={filteredPurchaseOrderItems}
                    upcomingDeliveries={upcomingProductDeliveries}
                    onEdit={handleEditProduct}
                    onViewDetails={handleViewProductDetails}
                    onDelete={handleDeleteProduct}
                    onUpdate={(id, field, value) => updatePurchaseOrderItem(id, { [field]: value })}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Form Modal */}
      <RequisitionForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveRequisition}
        requisition={selectedRequisition}
        uniqueValues={uniqueValues}
      />

      {/* Detail Modal */}
      <RequisitionDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        requisition={selectedRequisitionForDetail}
      />

      {/* Products Modal */}
      <RequisitionProductsModal
        isOpen={productsModalOpen}
        onClose={() => setProductsModalOpen(false)}
        requisition={selectedRequisitionForProducts}
        isDarkMode={isDarkMode}
      />

      {/* Filters Modal */}
      <FiltersModal
        isOpen={filtersModalOpen}
        onClose={() => setFiltersModalOpen(false)}
        currentFilters={filters}
        onApplyFilters={handleFiltersChange}
        uniqueValues={uniqueValues}
        isDarkMode={isDarkMode}
      />

      {/* Product Form Modal */}
      <PurchaseOrderItemForm
        isOpen={productFormOpen}
        onClose={() => setProductFormOpen(false)}
        onSave={handleSaveProduct}
        item={selectedProduct}
        uniqueValues={productUniqueValues}
      />

      {/* Product Detail Modal */}
      <PurchaseOrderItemDetailModal
        isOpen={productDetailModalOpen}
        onClose={() => setProductDetailModalOpen(false)}
        item={selectedProductForDetail}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={bulkImportModalOpen}
        onClose={() => setBulkImportModalOpen(false)}
        onImportComplete={handleBulkImportComplete}
      />

      {/* Bulk Import Products Modal */}
      <BulkImportProductsModal
        isOpen={bulkImportProductsModalOpen}
        onClose={() => setBulkImportProductsModalOpen(false)}
        onImportComplete={handleBulkImportProductsComplete}
      />

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <input
        ref={productFileInputRef}
        type="file"
        accept=".csv"
        onChange={handleProductFileChange}
        style={{ display: 'none' }}
      />

      {/* Migration Modal */}
      {showMigrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full p-6 transition-colors duration-200`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Migração de Dados Necessária
            </h2>

            {migrationStatus.inProgress ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {migrationStatus.message}
                </p>
              </div>
            ) : migrationStatus.type === 'success' ? (
              <div className="text-center py-4">
                <div className="text-green-500 text-5xl mb-4">✓</div>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {migrationStatus.message}
                </p>
              </div>
            ) : migrationStatus.type === 'error' ? (
              <div>
                <div className={`${isDarkMode ? 'bg-red-900/20 border-red-600 text-red-400' : 'bg-red-100 border-red-400 text-red-700'} px-4 py-3 rounded mb-4 border transition-colors duration-200`}>
                  <p>{migrationStatus.message}</p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowMigrationModal(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleMigration}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                  Detectamos que você tem dados armazenados localmente no seu navegador.
                  Deseja migrar esses dados para o banco de dados Supabase?
                </p>
                <div className={`${isDarkMode ? 'bg-blue-900/20 border-blue-600 text-blue-400' : 'bg-blue-100 border-blue-400 text-blue-700'} px-4 py-3 rounded mb-4 border transition-colors duration-200`}>
                  <p className="text-sm">
                    <strong>Dados encontrados:</strong>
                    <br />
                    {(() => {
                      const check = checkIfMigrationNeeded();
                      return (
                        <>
                          {check.requisitionsCount} requisições
                          <br />
                          {check.purchaseOrdersCount} itens de pedido
                        </>
                      );
                    })()}
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowMigrationModal(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Agora Não
                  </button>
                  <button
                    onClick={handleMigration}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    Migrar Dados
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;