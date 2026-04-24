import React, { useState, useCallback, useRef } from 'react';
import {
  Upload, X, ChevronRight, ChevronLeft, ArrowRight, CheckCircle,
  AlertCircle, AlertTriangle, Loader, RefreshCw, FileSpreadsheet,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import {
  ImportTarget,
  ColumnMapping,
  PreviewData,
  ImportRowResult,
  ImportSummary,
  REQUISITION_FIELDS,
  PURCHASE_ORDER_FIELDS,
  autoDetectMapping,
  parseFileToPreview,
  mapRowToRequisition,
  mapRowToPurchaseOrder,
  validateRequisitionRow,
  validatePurchaseOrderRow,
} from '../../utils/omieImporter';
import { normalizeProjectName } from '../../utils/formatters';

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'done';

interface OmieImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  isDarkMode: boolean;
}

const MAPPING_STORAGE_KEY = 'omie_column_mapping_v1';

function loadSavedMapping(target: ImportTarget): ColumnMapping {
  try {
    const saved = localStorage.getItem(`${MAPPING_STORAGE_KEY}_${target}`);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveMapping(target: ImportTarget, mapping: ColumnMapping) {
  try {
    localStorage.setItem(`${MAPPING_STORAGE_KEY}_${target}`, JSON.stringify(mapping));
  } catch {
    // ignore
  }
}

export function OmieImportModal({ isOpen, onClose, onImportComplete, isDarkMode }: OmieImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [target, setTarget] = useState<ImportTarget>('requisitions');
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [conflictMode, setConflictMode] = useState<'update' | 'skip'>('update');
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importProgress, setImportProgress] = useState({ processed: 0, total: 0 });
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fields = target === 'requisitions' ? REQUISITION_FIELDS : PURCHASE_ORDER_FIELDS;

  const reset = () => {
    setStep('upload');
    setPreviewData(null);
    setMapping({});
    setImportSummary(null);
    setImportProgress({ processed: 0, total: 0 });
    setFileError(null);
    setIsDragging(false);
  };

  const handleClose = () => {
    if (step !== 'importing') {
      reset();
      onClose();
    }
  };

  const processFile = useCallback(async (file: File) => {
    setFileError(null);
    try {
      const data = await parseFileToPreview(file);
      if (data.headers.length === 0) {
        setFileError('O arquivo está vazio ou não contém cabeçalhos válidos.');
        return;
      }
      if (data.totalRows === 0) {
        setFileError('O arquivo não contém dados além do cabeçalho.');
        return;
      }

      setPreviewData(data);

      // Merge saved mapping with auto-detected
      const saved = loadSavedMapping(target);
      const auto = autoDetectMapping(data.headers, target);
      // Saved takes priority, but only keep saved columns that exist in current headers
      const merged: ColumnMapping = { ...auto };
      for (const [field, col] of Object.entries(saved)) {
        if (data.headers.includes(col)) {
          merged[field] = col;
        }
      }
      setMapping(merged);
      setStep('mapping');
    } catch (err) {
      setFileError(`Erro ao processar arquivo: ${err instanceof Error ? err.message : 'Formato inválido'}`);
    }
  }, [target]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  }, [processFile]);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMappingChange = (field: string, column: string) => {
    setMapping(prev => ({ ...prev, [field]: column }));
  };

  const handleProceedToPreview = () => {
    saveMapping(target, mapping);
    setStep('preview');
  };

  const previewRows = previewData?.rows.slice(0, 5) ?? [];
  const allRows = previewData?.rows ?? [];

  // Validate all rows
  const validationResults = allRows.map((row, idx) => {
    if (target === 'requisitions') {
      const mapped = mapRowToRequisition(row, mapping);
      const validation = validateRequisitionRow(mapped);
      const identifier = mapped.rc || `Linha ${idx + 2}`;
      return { idx, identifier, mapped, validation };
    } else {
      const mapped = mapRowToPurchaseOrder(row, mapping);
      const validation = validatePurchaseOrderRow(mapped);
      const identifier = mapped.numeroPo || `Linha ${idx + 2}`;
      return { idx, identifier, mapped, validation };
    }
  });

  const validCount = validationResults.filter(r => r.validation.valid).length;
  const errorCount = validationResults.filter(r => !r.validation.valid).length;
  const warningCount = validationResults.filter(r => r.validation.valid && r.validation.warnings.length > 0).length;

  const handleImport = async () => {
    setStep('importing');
    setImportProgress({ processed: 0, total: allRows.length });

    const results: ImportRowResult[] = [];
    let newRecords = 0;
    let updatedRecords = 0;
    let skippedRecords = 0;
    let errorRecords = 0;

    if (target === 'requisitions') {
      // Fetch all existing RCs for conflict detection
      const { data: existingData } = await supabase.from('requisitions').select('id, rc');
      const existingByRc = new Map((existingData ?? []).map(r => [r.rc?.toLowerCase(), r.id]));

      for (let i = 0; i < validationResults.length; i++) {
        const { idx, identifier, mapped, validation } = validationResults[i];

        if (!validation.valid) {
          results.push({ rowIndex: idx, status: 'error', identifier, message: validation.errors.join(', ') });
          errorRecords++;
          setImportProgress({ processed: i + 1, total: allRows.length });
          continue;
        }

        const rcKey = mapped.rc.toLowerCase();
        const existingId = existingByRc.get(rcKey);

        try {
          if (existingId) {
            if (conflictMode === 'skip') {
              results.push({ rowIndex: idx, status: 'skipped', identifier, message: 'RC já existe (ignorado)' });
              skippedRecords++;
            } else {
              // Partial update: only update OMIE fields + financial fields
              const updateFields: Record<string, unknown> = {};
              if (mapped.omieInclusion) updateFields.omie_inclusion = mapped.omieInclusion;
              if (mapped.omieApproval) updateFields.omie_approval = mapped.omieApproval;
              if (mapped.invoiceValue) updateFields.invoice_value = mapped.invoiceValue;
              if (mapped.invoiceNumber) updateFields.invoice_number = mapped.invoiceNumber;
              if (mapped.paymentMethod) updateFields.payment_method = mapped.paymentMethod;
              if (mapped.dueDate1) updateFields.due_date_1 = mapped.dueDate1;
              if (mapped.dueDate2) updateFields.due_date_2 = mapped.dueDate2;
              if (mapped.dueDate3) updateFields.due_date_3 = mapped.dueDate3;
              if (mapped.status) updateFields.status = mapped.status;
              if (mapped.supplier) updateFields.supplier = mapped.supplier;
              if (mapped.deliveryForecast) updateFields.delivery_forecast = mapped.deliveryForecast;

              const { error } = await supabase.from('requisitions').update(updateFields).eq('id', existingId);
              if (error) throw error;
              results.push({ rowIndex: idx, status: 'updated', identifier });
              updatedRecords++;
            }
          } else {
            // Insert new
            const insertData = {
              rc: mapped.rc,
              project: normalizeProjectName(mapped.project || ''),
              category: mapped.category || null,
              item: mapped.item || '',
              freight: false,
              supplier: mapped.supplier || null,
              observations: mapped.observations || null,
              po_sent: mapped.poSent || null,
              status: mapped.status,
              update_date: new Date().toISOString().split('T')[0],
              adt_invoice: mapped.adtInvoice || null,
              quotation_deadline: null,
              omie_inclusion: mapped.omieInclusion || null,
              delivery_forecast: mapped.deliveryForecast || null,
              quotation_inclusion: mapped.quotationInclusion || null,
              sent_for_approval: mapped.sentForApproval || null,
              omie_approval: mapped.omieApproval || null,
              criticality: mapped.criticality,
              dismembered_rc: null,
              invoice_value: mapped.invoiceValue || 0,
              invoice_number: mapped.invoiceNumber || null,
              payment_method: mapped.paymentMethod || null,
              due_date_1: mapped.dueDate1 || null,
              due_date_2: mapped.dueDate2 || null,
              due_date_3: mapped.dueDate3 || null,
              quoted_by: mapped.quotedBy || null,
              freight_value: 0,
              freight_status: null,
              freight_company: null,
              quoted_supplier: mapped.quotedSupplier || null,
              quotation_type: 'Simples',
            };
            const { error } = await supabase.from('requisitions').insert(insertData);
            if (error) throw error;
            results.push({ rowIndex: idx, status: 'success', identifier });
            newRecords++;
          }
        } catch (err) {
          results.push({ rowIndex: idx, status: 'error', identifier, message: err instanceof Error ? err.message : 'Erro ao salvar' });
          errorRecords++;
        }

        setImportProgress({ processed: i + 1, total: allRows.length });
      }
    } else {
      // Purchase orders
      const { data: existingData } = await supabase.from('purchase_order_items').select('id, numero_po, cod_item, descricao_item');
      const existingMap = new Map((existingData ?? []).map(r => [`${r.numero_po}__${r.cod_item || ''}__${r.descricao_item}`, r.id]));

      for (let i = 0; i < validationResults.length; i++) {
        const { idx, identifier, mapped, validation } = validationResults[i];

        if (!validation.valid) {
          results.push({ rowIndex: idx, status: 'error', identifier, message: validation.errors.join(', ') });
          errorRecords++;
          setImportProgress({ processed: i + 1, total: allRows.length });
          continue;
        }

        const poMapped = mapped as ReturnType<typeof mapRowToPurchaseOrder>;
        const conflictKey = `${poMapped.numeroPo}__${poMapped.codItem || ''}__${poMapped.descricaoItem}`;
        const existingId = existingMap.get(conflictKey);

        try {
          if (existingId) {
            if (conflictMode === 'skip') {
              results.push({ rowIndex: idx, status: 'skipped', identifier, message: 'PO já existe (ignorado)' });
              skippedRecords++;
            } else {
              const updateFields: Record<string, unknown> = {
                ultima_atualizacao: new Date().toISOString().split('T')[0],
              };
              if (poMapped.quantidade) updateFields.quantidade = poMapped.quantidade;
              if (poMapped.quantidadeEntregue) updateFields.quantidade_entregue = poMapped.quantidadeEntregue;
              if (poMapped.valorUnitario) updateFields.valor_unitario = poMapped.valorUnitario;
              if (poMapped.dataEntrega) updateFields.data_entrega = poMapped.dataEntrega;
              if (poMapped.status) updateFields.status = poMapped.status;
              if (poMapped.condicoesPagamento) updateFields.condicoes_pagamento = poMapped.condicoesPagamento;

              const { error } = await supabase.from('purchase_order_items').update(updateFields).eq('id', existingId);
              if (error) throw error;
              results.push({ rowIndex: idx, status: 'updated', identifier });
              updatedRecords++;
            }
          } else {
            const insertData = {
              numero_po: poMapped.numeroPo,
              descricao_item: poMapped.descricaoItem,
              cod_item: poMapped.codItem || null,
              ncm: poMapped.ncm || null,
              garantia: poMapped.garantia || null,
              quantidade: poMapped.quantidade || 0,
              quantidade_entregue: poMapped.quantidadeEntregue || 0,
              valor_unitario: poMapped.valorUnitario || 0,
              moeda: poMapped.moeda || 'BRL',
              data_po: poMapped.dataPo || null,
              data_entrega: poMapped.dataEntrega || null,
              condicoes_pagamento: poMapped.condicoesPagamento || null,
              status: poMapped.status,
              observacoes: poMapped.observacoes || null,
              ultima_atualizacao: new Date().toISOString().split('T')[0],
              requisition_id: null,
            };
            const { error } = await supabase.from('purchase_order_items').insert(insertData);
            if (error) throw error;
            results.push({ rowIndex: idx, status: 'success', identifier });
            newRecords++;
          }
        } catch (err) {
          results.push({ rowIndex: idx, status: 'error', identifier, message: err instanceof Error ? err.message : 'Erro ao salvar' });
          errorRecords++;
        }

        setImportProgress({ processed: i + 1, total: allRows.length });
      }
    }

    setImportSummary({ newRecords, updatedRecords, skippedRecords, errorRecords, results });
    setStep('done');
    onImportComplete();
  };

  const handleDownloadReport = () => {
    if (!importSummary) return;
    const rows = [
      ['Linha', 'Identificador', 'Status', 'Mensagem'],
      ...importSummary.results.map(r => [
        String(r.rowIndex + 2),
        r.identifier,
        r.status === 'success' ? 'Novo' : r.status === 'updated' ? 'Atualizado' : r.status === 'skipped' ? 'Ignorado' : 'Erro',
        r.message || ''
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultado');
    XLSX.writeFile(wb, `importacao_omie_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!isOpen) return null;

  const bg = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const border = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const text = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-gray-50';
  const inputClass = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500';

  const stepLabels: Record<Step, string> = {
    upload: 'Upload',
    mapping: 'Mapear Colunas',
    preview: 'Revisar',
    importing: 'Importando',
    done: 'Concluído',
  };
  const stepOrder: Step[] = ['upload', 'mapping', 'preview', 'importing', 'done'];
  const currentStepIdx = stepOrder.indexOf(step);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className={`${bg} rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${border} flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${text}`}>Importar do OMIE</h2>
              <p className={`text-xs ${textMuted}`}>Importe dados exportados do sistema OMIE</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={step === 'importing'}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className={`px-6 py-3 border-b ${border} flex-shrink-0`}>
          <div className="flex items-center gap-1">
            {(['upload', 'mapping', 'preview', 'done'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 ${i <= currentStepIdx ? 'text-blue-600' : textMuted}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0
                    ${i < currentStepIdx ? 'bg-blue-600 text-white' : i === currentStepIdx ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' : `${isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'}`}`}>
                    {i < currentStepIdx ? <CheckCircle className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{stepLabels[s]}</span>
                </div>
                {i < 3 && <ArrowRight className={`w-3 h-3 flex-shrink-0 ${textMuted}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* STEP: UPLOAD */}
          {step === 'upload' && (
            <div className="p-6 space-y-6">
              {/* Target selector */}
              <div>
                <p className={`text-sm font-medium ${text} mb-3`}>O que deseja importar?</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['requisitions', 'purchase_orders'] as ImportTarget[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setTarget(t)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        target === t
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : `${border} ${cardBg} hover:border-gray-400`
                      }`}
                    >
                      <p className={`font-semibold text-sm ${target === t ? 'text-blue-700' : text}`}>
                        {t === 'requisitions' ? 'Requisições' : 'Pedidos de Compra (PO)'}
                      </p>
                      <p className={`text-xs mt-0.5 ${target === t ? 'text-blue-600' : textMuted}`}>
                        {t === 'requisitions'
                          ? 'RC, status OMIE, NF, vencimentos...'
                          : 'Número PO, itens, quantidades, entregas...'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : `${isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`
                }`}
              >
                <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-blue-500' : textMuted}`} />
                <p className={`text-base font-medium ${text} mb-1`}>Arraste o arquivo ou clique para selecionar</p>
                <p className={`text-sm ${textMuted}`}>Suporta CSV e Excel (.xlsx, .xls)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {fileError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{fileError}</p>
                </div>
              )}

              <div className={`${cardBg} rounded-xl p-4`}>
                <p className={`text-xs font-medium ${text} mb-2`}>Como exportar do OMIE:</p>
                <ol className={`text-xs ${textMuted} space-y-1 list-decimal list-inside`}>
                  <li>Acesse o modulo desejado no OMIE (Compras, Requisicoes, etc.)</li>
                  <li>Use a funcao "Exportar" ou "Relatorios" e escolha Excel ou CSV</li>
                  <li>Salve o arquivo e faca o upload aqui</li>
                </ol>
              </div>
            </div>
          )}

          {/* STEP: MAPPING */}
          {step === 'mapping' && previewData && (
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm font-medium ${text}`}>Mapeamento de Colunas</p>
                  <p className={`text-xs ${textMuted} mt-0.5`}>
                    {previewData.totalRows} registros encontrados — Associe as colunas do arquivo OMIE aos campos do sistema
                  </p>
                </div>
                <button
                  onClick={() => {
                    const auto = autoDetectMapping(previewData.headers, target);
                    setMapping(auto);
                  }}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${border} ${textMuted} hover:text-blue-600 transition-colors`}
                >
                  <RefreshCw className="w-3 h-3" /> Auto-detectar
                </button>
              </div>

              <div className="grid gap-2">
                {fields.map(field => (
                  <div key={field.key as string} className={`grid grid-cols-2 gap-3 items-center p-2.5 rounded-lg ${cardBg}`}>
                    <div>
                      <span className={`text-sm font-medium ${text}`}>{field.label}</span>
                      {field.required && <span className="ml-1 text-red-500 text-xs">*</span>}
                    </div>
                    <select
                      value={mapping[field.key as string] || ''}
                      onChange={e => handleMappingChange(field.key as string, e.target.value)}
                      className={`text-sm border rounded-lg px-2 py-1.5 ${inputClass} w-full`}
                    >
                      <option value="">-- Não mapear --</option>
                      {previewData.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview of first 3 rows */}
              <div>
                <p className={`text-xs font-medium ${textMuted} mb-2`}>Previa dos primeiros registros:</p>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full text-xs">
                    <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <tr>
                        {Object.entries(mapping).filter(([, v]) => v).slice(0, 6).map(([field]) => {
                          const label = fields.find(f => f.key === field)?.label || field;
                          return <th key={field} className={`px-3 py-2 text-left font-medium ${textMuted}`}>{label}</th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.slice(0, 3).map((row, i) => (
                        <tr key={i} className={`border-t ${border}`}>
                          {Object.entries(mapping).filter(([, v]) => v).slice(0, 6).map(([field, col]) => (
                            <td key={field} className={`px-3 py-2 ${text} truncate max-w-[120px]`}>{row[col] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP: PREVIEW/REVIEW */}
          {step === 'preview' && previewData && (
            <div className="p-6 space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className={`${cardBg} rounded-xl p-4 text-center`}>
                  <p className="text-2xl font-bold text-blue-600">{previewData.totalRows}</p>
                  <p className={`text-xs ${textMuted} mt-0.5`}>Total de registros</p>
                </div>
                <div className={`${cardBg} rounded-xl p-4 text-center`}>
                  <p className="text-2xl font-bold text-green-600">{validCount}</p>
                  <p className={`text-xs ${textMuted} mt-0.5`}>Prontos para importar</p>
                </div>
                <div className={`${cardBg} rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-bold ${errorCount > 0 ? 'text-red-600' : textMuted}`}>{errorCount}</p>
                  <p className={`text-xs ${textMuted} mt-0.5`}>Com erros</p>
                </div>
              </div>

              {/* Conflict mode */}
              <div className={`${cardBg} rounded-xl p-4`}>
                <p className={`text-sm font-medium ${text} mb-3`}>Registros que ja existem no sistema:</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConflictMode('update')}
                    className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                      conflictMode === 'update'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20'
                        : `${border} ${textMuted}`
                    }`}
                  >
                    Atualizar campos do OMIE
                  </button>
                  <button
                    onClick={() => setConflictMode('skip')}
                    className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                      conflictMode === 'skip'
                        ? 'border-gray-600 bg-gray-100 text-gray-700 dark:bg-gray-700/50'
                        : `${border} ${textMuted}`
                    }`}
                  >
                    Ignorar duplicados
                  </button>
                </div>
                {conflictMode === 'update' && (
                  <p className={`text-xs ${textMuted} mt-2`}>
                    Serao atualizados: status, fornecedor, datas OMIE, valor NF, numero NF, vencimentos e previsao de entrega.
                    Outros campos nao serao sobrescritos.
                  </p>
                )}
              </div>

              {/* Validation issues */}
              {errorCount > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">{errorCount} registro(s) com erros serao ignorados na importacao</p>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {validationResults.filter(r => !r.validation.valid).slice(0, 5).map((r, i) => (
                      <p key={i} className="text-xs text-red-600 dark:text-red-400">
                        Linha {r.idx + 2} ({r.identifier}): {r.validation.errors.join(', ')}
                      </p>
                    ))}
                    {errorCount > 5 && <p className="text-xs text-red-500">... e mais {errorCount - 5} erros</p>}
                  </div>
                </div>
              )}

              {warningCount > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">{warningCount} registro(s) com avisos (serao importados assim mesmo)</p>
                  </div>
                </div>
              )}

              {/* Data preview table */}
              <div>
                <p className={`text-xs font-medium ${textMuted} mb-2`}>Previa dos dados (5 primeiros registros):</p>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full text-xs">
                    <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                      <tr>
                        <th className={`px-3 py-2 text-left font-medium ${textMuted}`}>Linha</th>
                        {fields.filter(f => mapping[f.key as string]).slice(0, 5).map(f => (
                          <th key={f.key as string} className={`px-3 py-2 text-left font-medium ${textMuted}`}>{f.label}</th>
                        ))}
                        <th className={`px-3 py-2 text-left font-medium ${textMuted}`}>Validacao</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResults.slice(0, 5).map((r) => (
                        <tr key={r.idx} className={`border-t ${border}`}>
                          <td className={`px-3 py-2 ${textMuted}`}>{r.idx + 2}</td>
                          {fields.filter(f => mapping[f.key as string]).slice(0, 5).map(f => (
                            <td key={f.key as string} className={`px-3 py-2 ${text} truncate max-w-[100px]`}>
                              {allRows[r.idx][mapping[f.key as string]] || '-'}
                            </td>
                          ))}
                          <td className="px-3 py-2">
                            {r.validation.valid
                              ? <span className="text-green-600 font-medium">OK</span>
                              : <span className="text-red-500 font-medium">Erro</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP: IMPORTING */}
          {step === 'importing' && (
            <div className="p-6 flex flex-col items-center justify-center min-h-[300px] space-y-6">
              <Loader className="w-12 h-12 text-blue-600 animate-spin" />
              <div className="text-center">
                <p className={`text-lg font-semibold ${text} mb-1`}>Importando dados...</p>
                <p className={`text-sm ${textMuted}`}>{importProgress.processed} de {importProgress.total} registros</p>
              </div>
              <div className="w-full max-w-sm">
                <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2 overflow-hidden`}>
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${importProgress.total > 0 ? (importProgress.processed / importProgress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP: DONE */}
          {step === 'done' && importSummary && (
            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className={`text-xl font-semibold ${text}`}>Importacao Concluida!</p>
                <p className={`text-sm ${textMuted} mt-1`}>{allRows.length} registros processados</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
                  <p className="text-2xl font-bold text-green-600">{importSummary.newRecords}</p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">Novos</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
                  <p className="text-2xl font-bold text-blue-600">{importSummary.updatedRecords}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">Atualizados</p>
                </div>
                <div className={`${cardBg} rounded-xl p-4 text-center border ${border}`}>
                  <p className={`text-2xl font-bold ${textMuted}`}>{importSummary.skippedRecords}</p>
                  <p className={`text-xs ${textMuted} mt-0.5`}>Ignorados</p>
                </div>
                <div className={`${importSummary.errorRecords > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : `${cardBg} border ${border}`} rounded-xl p-4 text-center border`}>
                  <p className={`text-2xl font-bold ${importSummary.errorRecords > 0 ? 'text-red-600' : textMuted}`}>{importSummary.errorRecords}</p>
                  <p className={`text-xs ${importSummary.errorRecords > 0 ? 'text-red-600' : textMuted} mt-0.5`}>Erros</p>
                </div>
              </div>

              {importSummary.results.filter(r => r.status === 'error').length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 p-4 max-h-40 overflow-y-auto">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">Erros encontrados:</p>
                  {importSummary.results.filter(r => r.status === 'error').map((r, i) => (
                    <p key={i} className="text-xs text-red-600 dark:text-red-400">
                      Linha {r.rowIndex + 2} ({r.identifier}): {r.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer / Action buttons */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${border} flex-shrink-0`}>
          <div>
            {step === 'mapping' && (
              <button
                onClick={() => setStep('upload')}
                className={`flex items-center gap-2 text-sm ${textMuted} hover:${text} transition-colors`}
              >
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={() => setStep('mapping')}
                className={`flex items-center gap-2 text-sm ${textMuted} hover:${text} transition-colors`}
              >
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step === 'done' && (
              <button
                onClick={handleDownloadReport}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border ${border} ${textMuted} hover:text-blue-600 transition-colors`}
              >
                <Download className="w-4 h-4" /> Baixar Relatorio
              </button>
            )}

            {step === 'upload' && (
              <button
                onClick={handleClose}
                className={`text-sm px-4 py-2 rounded-lg border ${border} ${textMuted} transition-colors`}
              >
                Cancelar
              </button>
            )}

            {step === 'mapping' && (
              <button
                onClick={handleProceedToPreview}
                className="flex items-center gap-2 text-sm px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 'preview' && (
              <button
                onClick={handleImport}
                disabled={validCount === 0}
                className="flex items-center gap-2 text-sm px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Importar {validCount} registro(s) <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 'done' && (
              <button
                onClick={handleClose}
                className="flex items-center gap-2 text-sm px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
