import { useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { parseCSVData } from '../utils/csvParser';
import { importRequisitionsToSupabase, ImportResult } from '../utils/importCsvToSupabase';
import * as XLSX from 'xlsx';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function BulkImportModal({ isOpen, onClose, onImportComplete }: BulkImportModalProps) {
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
    if (file) {
      await processFile(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setResult(null);
      setProgress({ processed: 0, total: 0, successful: 0, failed: 0 });

      let csvText: string;
      const fileExtension = file.name.toLowerCase().split('.').pop();

      // Processar arquivos Excel
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        console.log('Processando arquivo Excel...');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Pegar a primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Converter para CSV
        csvText = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
        console.log('Excel convertido para CSV');
      } else {
        // Processar arquivo CSV
        console.log('Processando arquivo CSV...');
        csvText = await file.text();
      }

      const requisitions = parseCSVData(csvText);
      console.log(`${requisitions.length} requisições parseadas`);

      setProgress({ processed: 0, total: requisitions.length, successful: 0, failed: 0 });

      const importResult = await importRequisitionsToSupabase(requisitions, (progressUpdate) => {
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
      console.error('Erro ao processar arquivo:', error);
      setResult({
        success: false,
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        errors: [{ line: 0, rc: 'N/A', error: error instanceof Error ? error.message : 'Erro desconhecido' }],
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Importação em Massa de Requisições
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!isProcessing && !result && (
            <>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Arraste o arquivo aqui
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  CSV ou Excel (.xlsx, .xls)
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block">
                    Selecionar Arquivo
                  </span>
                </label>
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Formato esperado:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Arquivo CSV (separado por ponto e vírgula) ou Excel (.xlsx, .xls)</li>
                  <li>• Primeira linha com cabeçalhos</li>
                  <li>• Colunas: RC, PROJETO, CATEGORIA, ITEM, FRETE, FORNECEDOR, etc.</li>
                  <li>• Datas no formato DD/MM/YYYY ou YYYY-MM-DD</li>
                </ul>
              </div>
            </>
          )}

          {isProcessing && (
            <div className="py-8">
              <div className="flex items-center justify-center mb-6">
                <Loader className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-center text-gray-900 mb-4">
                Importando requisições...
              </h3>

              <div className="space-y-4">
                <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${progress.total > 0 ? (progress.processed / progress.total) * 100 : 0}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{progress.processed}</p>
                    <p className="text-sm text-gray-600">Processadas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{progress.successful}</p>
                    <p className="text-sm text-gray-600">Sucesso</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
                    <p className="text-sm text-gray-600">Falhas</p>
                  </div>
                </div>

                <p className="text-center text-gray-600">
                  {progress.processed} de {progress.total} registros
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="py-6">
              {result.success ? (
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Importação Concluída!
                  </h3>
                  <p className="text-gray-600 mb-6">{result.message}</p>

                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-3xl font-bold text-green-600">{result.successful}</p>
                      <p className="text-sm text-green-800">Importadas</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-3xl font-bold text-red-600">{result.failed}</p>
                      <p className="text-sm text-red-800">Falhas</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">
                    Fechando automaticamente...
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Erro na Importação
                  </h3>
                  <p className="text-gray-600 mb-6">{result.message}</p>

                  {result.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto text-left">
                      <h4 className="font-medium text-red-900 mb-2">Erros encontrados:</h4>
                      <ul className="text-sm text-red-800 space-y-1">
                        {result.errors.slice(0, 10).map((error, index) => (
                          <li key={index}>
                            Linha {error.line} (RC: {error.rc}): {error.error}
                          </li>
                        ))}
                        {result.errors.length > 10 && (
                          <li className="font-medium">
                            ... e mais {result.errors.length - 10} erros
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={handleClose}
                    className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
