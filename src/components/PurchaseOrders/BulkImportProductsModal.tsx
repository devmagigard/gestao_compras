import { useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { parseProductCSVData, parseProductExcelRows } from '../../utils/productCsvParser';
import { importProductsToSupabase, ImportResult } from '../../utils/importProductsToSupabase';
import { exportProductTemplate } from '../../utils/productExporter';
import * as XLSX from 'xlsx';

interface BulkImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function BulkImportProductsModal({ isOpen, onClose, onImportComplete }: BulkImportProductsModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0, successful: 0, failed: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const processFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setResult(null);
      setProgress({ processed: 0, total: 0, successful: 0, failed: 0 });

      const fileExtension = file.name.toLowerCase().split('.').pop();
      let products;

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, string | number | Date | undefined>[];
        products = parseProductExcelRows(rows);
      } else {
        const csvText = await file.text();
        products = parseProductCSVData(csvText);
      }

      setProgress({ processed: 0, total: products.length, successful: 0, failed: 0 });

      const importResult = await importProductsToSupabase(products, (progressUpdate) => {
        setProgress({
          processed: progressUpdate.processed,
          total: progressUpdate.total,
          successful: progressUpdate.successful,
          failed: progressUpdate.failed
        });
      });

      setResult(importResult);

      if (importResult.success) {
        setTimeout(() => {
          onImportComplete();
          onClose();
        }, 3000);
      }

    } catch (error) {
      setResult({
        success: false,
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        errors: [{ line: 0, item: 'N/A', error: error instanceof Error ? error.message : 'Erro desconhecido' }],
        message: `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setResult(null);
      setProgress({ processed: 0, total: 0, successful: 0, failed: 0 });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Importar Produtos em Massa</h2>
              <p className="text-xs text-gray-500">Adicione varios produtos de uma vez via Excel ou CSV</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!isProcessing && !result && (
            <>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <FileText className="w-8 h-8 text-gray-500" />
                  </div>
                </div>
                <p className="text-base font-semibold text-gray-700 mb-1">
                  Arraste seu arquivo aqui
                </p>
                <p className="text-sm text-gray-400 mb-5">
                  Suporte a Excel (.xlsx, .xls) e CSV
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <label className="inline-block">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <span className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer inline-block transition-colors shadow-sm">
                      Selecionar Arquivo
                    </span>
                  </label>
                  <button
                    onClick={() => exportProductTemplate()}
                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 inline-flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4 text-green-600" />
                    Baixar Template Excel
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Campos obrigatorios</h3>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                      Numero PO
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                      Descricao do Item
                    </li>
                  </ul>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Formatos aceitos</h3>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>
                      Excel: .xlsx ou .xls
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>
                      CSV separado por ponto e virgula
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>
                      Datas: DD/MM/AAAA ou AAAA-MM-DD
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>
                      Moeda: BRL, USD, EUR, GBP, JPY, CNY
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Use o template para garantir que as colunas estejam no formato correto. O sistema reconhece automaticamente os cabecalhos, mesmo que a ordem seja diferente.
                </p>
              </div>
            </>
          )}

          {isProcessing && (
            <div className="py-8">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <Loader className="w-12 h-12 text-blue-600 animate-spin" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-900 mb-6">
                Importando produtos...
              </h3>

              <div className="space-y-4">
                <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progress.total > 0 ? (progress.processed / progress.total) * 100 : 0}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-gray-900">{progress.processed}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Processados</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-green-600">{progress.successful}</p>
                    <p className="text-xs text-green-600 mt-0.5">Sucesso</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
                    <p className="text-xs text-red-500 mt-0.5">Falhas</p>
                  </div>
                </div>

                <p className="text-center text-sm text-gray-500">
                  {progress.processed} de {progress.total} registros
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="py-4">
              {result.success ? (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="w-9 h-9 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Importacao Concluida!
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">{result.message}</p>

                  <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-5">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-3xl font-bold text-green-600">{result.successful}</p>
                      <p className="text-xs text-green-700 mt-1">Importados</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-3xl font-bold text-gray-400">{result.failed}</p>
                      <p className="text-xs text-gray-500 mt-1">Falhas</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">Fechando automaticamente...</p>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mb-3">
                      <AlertCircle className="w-7 h-7 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Erro na Importacao
                    </h3>
                    <p className="text-sm text-gray-500">{result.message}</p>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-h-52 overflow-y-auto mb-5">
                      <h4 className="text-sm font-semibold text-red-900 mb-2">Erros encontrados:</h4>
                      <ul className="text-xs text-red-700 space-y-1.5">
                        {result.errors.slice(0, 10).map((error, index) => (
                          <li key={index} className="flex gap-2">
                            <span className="font-medium flex-shrink-0">Linha {error.line}:</span>
                            <span>{error.error}</span>
                          </li>
                        ))}
                        {result.errors.length > 10 && (
                          <li className="font-medium text-red-800 pt-1">
                            ... e mais {result.errors.length - 10} erros
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={() => { setResult(null); setProgress({ processed: 0, total: 0, successful: 0, failed: 0 }); }}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
