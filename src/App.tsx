import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { Header } from './components/Layout/Header';
import { MetricsCards } from './components/Dashboard/MetricsCards';
import { RecentActivity } from './components/Dashboard/RecentActivity';
import { RequisitionsTable } from './components/Requisitions/RequisitionsTable';
import { RequisitionForm } from './components/Requisitions/RequisitionForm';
import { RequisitionDetailModal } from './components/Requisitions/RequisitionDetailModal';
import { FiltersModal } from './components/FiltersModal';
import { useSupabaseRequisitions } from './hooks/useSupabaseRequisitions';
import { FilterState, Requisition, RequisitionStatus } from './types';
import { REQUISITION_STATUSES } from './utils/constants';
import { parseCSVData } from './utils/csvParser';
import { exportToCSV, exportToExcel } from './utils/excelExporter';

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

  const [currentView, setCurrentView] = useState<'dashboard' | 'requisitions'>('dashboard');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [selectedRequisitionForDetail, setSelectedRequisitionForDetail] = useState<Requisition | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    rcSearch: '',
    projectSearch: '',
    statusSearch: '',
    freightFilter: 'all',
    attentionFilter: 'all'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    fileInputRef.current?.click();
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

  const metrics = getDashboardMetrics();
  const uniqueValues = getUniqueValues();

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
        onNewRequisition={handleNewRequisition}
        onImport={handleImport}
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
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
              ) : (
                <RequisitionsTable
                  requisitions={filteredRequisitions}
                  upcomingDeliveries={upcomingDeliveries}
                  onEdit={handleEditRequisition}
                  onViewDetails={handleViewDetails}
                  onDelete={handleDeleteRequisition}
                  onUpdate={(id, field, value) => updateRequisition(id, { [field]: value })}
                  isDarkMode={isDarkMode}
                />
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

      {/* Filters Modal */}
      <FiltersModal
        isOpen={filtersModalOpen}
        onClose={() => setFiltersModalOpen(false)}
        currentFilters={filters}
        onApplyFilters={handleFiltersChange}
        uniqueValues={uniqueValues}
        isDarkMode={isDarkMode}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default App;