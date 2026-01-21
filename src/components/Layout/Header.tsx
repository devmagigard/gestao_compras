import React, { useState } from 'react';
import { Plus, Upload, Sun, Moon, Trash2 } from 'lucide-react';
import { ExportDropdown } from './ExportDropdown';

interface HeaderProps {
  onNewRequisition: () => void;
  onImport: () => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onClearAllData: () => Promise<void>;
}

export function Header({ onNewRequisition, onImport, onExportCSV, onExportExcel, isDarkMode, onToggleTheme, onClearAllData }: HeaderProps) {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAll = async () => {
    if (!confirm('⚠️ ATENÇÃO: Isso irá apagar TODOS os dados do sistema (Requisições e Pedidos de Compra). Esta ação não pode ser desfeita. Deseja continuar?')) {
      return;
    }

    if (!confirm('Última confirmação: Tem certeza ABSOLUTA que deseja apagar todos os dados?')) {
      return;
    }

    setIsClearing(true);
    try {
      await onClearAllData();
      alert('✓ Todos os dados foram apagados com sucesso!');
    } catch (error) {
      alert('✗ Erro ao apagar dados: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <header className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b transition-colors duration-200`}>
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <img
                src="https://www.windwerk.com.br/windwerk/wp-content/themes/windwerk/img/logo.png"
                alt="Windwerk Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className={`text-lg sm:text-xl lg:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate transition-colors duration-200`}>
                Sistema de Controle de Requisições
              </h1>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} hidden sm:block transition-colors duration-200`}>
                Gestão completa de suprimentos e pedidos
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDarkMode
                  ? 'text-gray-500 hover:text-red-400 hover:bg-gray-800 border border-transparent hover:border-gray-700'
                  : 'text-gray-400 hover:text-red-600 hover:bg-gray-50 border border-transparent hover:border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Apagar todos os dados"
            >
              <Trash2 className={`h-4 w-4 ${isClearing ? 'animate-pulse' : ''}`} />
            </button>

            <button
              onClick={onToggleTheme}
              className={`p-2 lg:px-3 lg:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDarkMode
                  ? 'text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-600'
                  : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
             {isDarkMode ? (
               <Sun className="h-5 w-5" />
             ) : (
               <Moon className="h-5 w-5" />
             )}
            </button>
            
            <button
              onClick={onImport}
              className={`hidden sm:inline-flex items-center px-3 lg:px-4 py-2 border rounded-lg text-sm font-medium transition-all duration-200 ${
                isDarkMode
                  ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <Upload className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Importar CSV</span>
            </button>
            
            <div className="hidden sm:block">
              <ExportDropdown 
                onExportCSV={onExportCSV}
                onExportExcel={onExportExcel}
                isDarkMode={isDarkMode}
              />
            </div>
            
            <button
              onClick={onNewRequisition}
              className="inline-flex items-center px-3 lg:px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Plus className="h-4 w-4 lg:mr-2" />
              <span className="hidden sm:inline lg:inline">Nova</span>
              <span className="hidden lg:inline ml-1">Requisição</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}