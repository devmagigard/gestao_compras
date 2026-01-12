import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';

interface ExportDropdownProps {
  onExportCSV: () => void;
  onExportExcel: () => void;
  isDarkMode?: boolean;
}

export function ExportDropdown({ onExportCSV, onExportExcel, isDarkMode = false }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExportCSV = () => {
    onExportCSV();
    setIsOpen(false);
  };

  const handleExportExcel = () => {
    onExportExcel();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-3 lg:px-4 py-2 border rounded-lg text-sm font-medium transition-all duration-200 ${
          isDarkMode
            ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'
            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
      >
        <Download className="h-4 w-4 lg:mr-2" />
        <span className="hidden lg:inline">Exportar</span>
        <ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <div className="py-1">
            <button
              onClick={handleExportCSV}
              className={`flex items-center w-full px-4 py-3 text-sm transition-colors ${
                isDarkMode
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <FileText className="h-4 w-4 mr-3 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Exportar CSV</div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Arquivo de texto separado por vírgulas
                </div>
              </div>
            </button>
            
            <button
              onClick={handleExportExcel}
              className={`flex items-center w-full px-4 py-3 text-sm transition-colors ${
                isDarkMode
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4 mr-3 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Exportar Excel</div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Planilha Excel (.xlsx) formatada
                </div>
              </div>
            </button>
          </div>
          
          <div className={`px-4 py-2 border-t text-xs ${
            isDarkMode 
              ? 'border-gray-700 text-gray-400 bg-gray-900/50' 
              : 'border-gray-200 text-gray-500 bg-gray-50'
          }`}>
            💡 Apenas dados filtrados serão exportados
          </div>
        </div>
      )}
    </div>
  );
}