import * as XLSX from 'xlsx';
import { Requisition, PurchaseOrderItem, RequisitionStatus, Criticality, Currency, PurchaseOrderStatus } from '../types';

export type ImportTarget = 'requisitions' | 'purchase_orders';

export interface ColumnMapping {
  [systemField: string]: string; // systemField -> csvColumn
}

export interface ParsedRow {
  [key: string]: string;
}

export interface PreviewData {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImportRowResult {
  rowIndex: number;
  status: 'success' | 'updated' | 'skipped' | 'error';
  identifier: string;
  message?: string;
}

export interface ImportSummary {
  newRecords: number;
  updatedRecords: number;
  skippedRecords: number;
  errorRecords: number;
  results: ImportRowResult[];
}

// System field definitions with labels
export const REQUISITION_FIELDS: { key: keyof Requisition; label: string; required?: boolean }[] = [
  { key: 'rc', label: 'RC', required: true },
  { key: 'project', label: 'Projeto' },
  { key: 'item', label: 'Descrição do Item' },
  { key: 'category', label: 'Categoria' },
  { key: 'supplier', label: 'Fornecedor' },
  { key: 'status', label: 'Status' },
  { key: 'criticality', label: 'Criticidade' },
  { key: 'omieInclusion', label: 'Inclusão no OMIE' },
  { key: 'omieApproval', label: 'Aprovação OMIE' },
  { key: 'invoiceValue', label: 'Valor NF' },
  { key: 'invoiceNumber', label: 'Número NF' },
  { key: 'paymentMethod', label: 'Forma de Pagamento' },
  { key: 'dueDate1', label: 'Vencimento Parcela 1' },
  { key: 'dueDate2', label: 'Vencimento Parcela 2' },
  { key: 'dueDate3', label: 'Vencimento Parcela 3' },
  { key: 'quotationInclusion', label: 'Inclusão para Cotação' },
  { key: 'sentForApproval', label: 'Enviado para Aprovação' },
  { key: 'deliveryForecast', label: 'Previsão de Entrega' },
  { key: 'poSent', label: 'PO Enviado' },
  { key: 'quotedBy', label: 'Cotado Por' },
  { key: 'quotedSupplier', label: 'Fornecedor Cotado' },
  { key: 'adtInvoice', label: 'ADT / Fatura' },
  { key: 'observations', label: 'Observações' },
];

export const PURCHASE_ORDER_FIELDS: { key: keyof PurchaseOrderItem; label: string; required?: boolean }[] = [
  { key: 'numeroPo', label: 'Número PO', required: true },
  { key: 'descricaoItem', label: 'Descrição do Item', required: true },
  { key: 'codItem', label: 'Código do Item' },
  { key: 'ncm', label: 'NCM' },
  { key: 'quantidade', label: 'Quantidade' },
  { key: 'quantidadeEntregue', label: 'Quantidade Entregue' },
  { key: 'valorUnitario', label: 'Valor Unitário' },
  { key: 'moeda', label: 'Moeda' },
  { key: 'dataPo', label: 'Data PO' },
  { key: 'dataEntrega', label: 'Data de Entrega' },
  { key: 'condicoesPagamento', label: 'Condições de Pagamento' },
  { key: 'garantia', label: 'Garantia' },
  { key: 'status', label: 'Status' },
  { key: 'observacoes', label: 'Observações' },
];

// Known OMIE column name patterns to auto-detect
const OMIE_COLUMN_HINTS: Record<string, string[]> = {
  // Requisition fields
  rc: ['rc', 'código rc', 'numero rc', 'número rc', 'cod rc', 'cod_rc'],
  project: ['projeto', 'project', 'obra', 'centro custo'],
  item: ['item', 'descrição', 'descricao', 'description', 'produto', 'serviço', 'servico'],
  category: ['categoria', 'category', 'tipo', 'classe'],
  supplier: ['fornecedor', 'supplier', 'vendor', 'empresa fornecedora'],
  status: ['status', 'situação', 'situacao', 'estado'],
  criticality: ['criticidade', 'criticality', 'prioridade', 'priority', 'urgência', 'urgencia'],
  omieInclusion: ['inclusão omie', 'inclusao omie', 'data inclusão omie', 'data inclusao omie', 'incluido omie', 'dt inclusão', 'dt inclusao'],
  omieApproval: ['aprovação omie', 'aprovacao omie', 'data aprovação omie', 'data aprovacao omie', 'aprovado omie', 'dt aprovação', 'dt aprovacao'],
  invoiceValue: ['valor nf', 'valor nota', 'valor fiscal', 'valor fatura', 'vl nf', 'vl nota', 'total nf', 'valor total'],
  invoiceNumber: ['número nf', 'numero nf', 'nf', 'nota fiscal', 'num nf', 'nr nf'],
  paymentMethod: ['forma pagamento', 'forma de pagamento', 'condicao pagamento', 'condição pagamento', 'tipo pagamento'],
  dueDate1: ['vencimento 1', 'vencimento parcela 1', 'dt venc 1', 'data vencimento 1', 'parcela 1'],
  dueDate2: ['vencimento 2', 'vencimento parcela 2', 'dt venc 2', 'data vencimento 2', 'parcela 2'],
  dueDate3: ['vencimento 3', 'vencimento parcela 3', 'dt venc 3', 'data vencimento 3', 'parcela 3'],
  quotationInclusion: ['inclusão cotação', 'inclusao cotacao', 'data cotação', 'data cotacao', 'dt cotação'],
  sentForApproval: ['enviado aprovação', 'enviado para aprovação', 'dt aprovação', 'data aprovacao'],
  deliveryForecast: ['previsão entrega', 'previsao entrega', 'entrega prevista', 'dt entrega', 'data entrega prevista'],
  poSent: ['po enviado', 'data po', 'dt po', 'numero po'],
  quotedBy: ['cotado por', 'responsável cotação', 'responsavel cotacao'],
  quotedSupplier: ['fornecedor cotado', 'fornecedor vencedor', 'fornecedor aprovado'],
  adtInvoice: ['adt', 'fatura', 'adt fatura', 'adt/fatura'],
  observations: ['observações', 'observacoes', 'obs', 'notas', 'notes', 'comentários'],
  // PurchaseOrder fields
  numeroPo: ['numero po', 'número po', 'num po', 'nr po', 'po', 'pedido compra', 'order number'],
  descricaoItem: ['descrição item', 'descricao item', 'descrição do item', 'descricao do item', 'item description', 'produto', 'material'],
  codItem: ['código item', 'codigo item', 'cod item', 'code', 'sku', 'part number'],
  ncm: ['ncm', 'código ncm', 'codigo ncm'],
  quantidade: ['quantidade', 'qtd', 'qty', 'quantity'],
  quantidadeEntregue: ['quantidade entregue', 'qtd entregue', 'entregue', 'delivered qty', 'qty delivered'],
  valorUnitario: ['valor unitário', 'valor unitario', 'preço unitário', 'preco unitario', 'unit price', 'vl unitário'],
  moeda: ['moeda', 'currency', 'divisa'],
  dataPo: ['data po', 'dt po', 'data pedido', 'order date'],
  dataEntrega: ['data entrega', 'data de entrega', 'dt entrega', 'delivery date', 'entrega'],
  condicoesPagamento: ['condições pagamento', 'condicoes pagamento', 'cond pagto', 'payment terms'],
  garantia: ['garantia', 'warranty', 'garantia meses'],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function autoDetectMapping(headers: string[], target: ImportTarget): ColumnMapping {
  const mapping: ColumnMapping = {};
  const fields = target === 'requisitions' ? REQUISITION_FIELDS : PURCHASE_ORDER_FIELDS;
  const normalizedHeaders = headers.map(h => ({ original: h, normalized: normalizeHeader(h) }));

  for (const field of fields) {
    const hints = OMIE_COLUMN_HINTS[field.key as string] || [];

    for (const hint of hints) {
      const normalizedHint = normalizeHeader(hint);
      const match = normalizedHeaders.find(h => h.normalized === normalizedHint || h.normalized.includes(normalizedHint));
      if (match) {
        mapping[field.key as string] = match.original;
        break;
      }
    }

    // If not found by hint, try direct match with field label
    if (!mapping[field.key as string]) {
      const fieldLabelNorm = normalizeHeader(field.label);
      const match = normalizedHeaders.find(h => h.normalized === fieldLabelNorm || h.normalized.includes(fieldLabelNorm));
      if (match) {
        mapping[field.key as string] = match.original;
      }
    }
  }

  return mapping;
}

export async function parseFileToPreview(file: File): Promise<PreviewData> {
  const ext = file.name.toLowerCase().split('.').pop();
  let rows: ParsedRow[] = [];
  let headers: string[] = [];

  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, dateNF: 'dd/mm/yyyy' });

    if (jsonData.length === 0) return { headers: [], rows: [], totalRows: 0 };

    headers = (jsonData[0] as string[]).map(h => String(h ?? '').trim()).filter(Boolean);

    for (let i = 1; i < jsonData.length; i++) {
      const rowArr = jsonData[i] as string[];
      const rowObj: ParsedRow = {};
      headers.forEach((h, idx) => {
        rowObj[h] = String(rowArr[idx] ?? '').trim();
      });
      // Skip completely empty rows
      if (Object.values(rowObj).some(v => v !== '')) {
        rows.push(rowObj);
      }
    }
  } else {
    // CSV
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return { headers: [], rows: [], totalRows: 0 };

    // Detect delimiter (;  or ,)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
      const rowObj: ParsedRow = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] ?? '';
      });
      if (Object.values(rowObj).some(v => v !== '')) {
        rows.push(rowObj);
      }
    }
  }

  return { headers, rows, totalRows: rows.length };
}

function parseDate(value: string): string {
  if (!value || value.trim() === '') return '';
  const v = value.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // DD/MM/YYYY or D/M/YYYY
  const dmyMatch = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    return `${dmyMatch[3]}-${month}-${day}`;
  }

  // DD-MM-YYYY
  const dmyDash = v.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyDash) {
    const day = dmyDash[1].padStart(2, '0');
    const month = dmyDash[2].padStart(2, '0');
    return `${dmyDash[3]}-${month}-${day}`;
  }

  // MM/DD/YYYY fallback
  const mdyMatch = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const month = mdyMatch[1].padStart(2, '0');
    const day = mdyMatch[2].padStart(2, '0');
    return `${mdyMatch[3]}-${month}-${day}`;
  }

  // Try native parsing
  const d = new Date(v);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return '';
}

function parseNumber(value: string): number {
  if (!value || value.trim() === '') return 0;
  // Remove currency symbols and spaces
  const cleaned = value.replace(/[R$€£¥\s]/g, '').trim();
  // Brazilian format: 1.234,56
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
  }
  // Standard format: 1,234.56
  if (/^\d{1,3}(,\d{3})*(\.\d+)?$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/,/g, '')) || 0;
  }
  return parseFloat(cleaned.replace(',', '.')) || 0;
}

function mapStatus(value: string): RequisitionStatus {
  const v = value.toLowerCase().trim();
  if (v.includes('cotaç') || v.includes('cotac') || v === 'em cotação') return 'Em cotação';
  if (v.includes('entrega') && v.includes('ag')) return 'Ag.Entrega';
  if (v.includes('pagamento') && v.includes('ag')) return 'Ag.Pagamento';
  if (v.includes('conclu')) return 'Concluído';
  if (v.includes('parcial')) return 'Entregue Parcialmente';
  if (v.includes('aprovaç') || v.includes('aprovac')) return 'Em Aprovação';
  if (v.includes('requisiç') || v.includes('requisic')) return 'Em Requisição';
  return 'Em cotação';
}

function mapPOStatus(value: string): PurchaseOrderStatus {
  const v = value.toLowerCase().trim();
  if (v.includes('trânsito') || v.includes('transito') || v.includes('transit')) return 'Em Trânsito';
  if (v.includes('parcial')) return 'Parcialmente Entregue';
  if (v.includes('entregue') || v.includes('entregado') || v.includes('delivered')) return 'Entregue';
  if (v.includes('cancel')) return 'Cancelado';
  if (v.includes('aguard')) return 'Aguardando Fornecedor';
  return 'Pedido';
}

function mapCriticality(value: string): Criticality {
  const v = value.toLowerCase().trim();
  if (v.includes('urgent') || v === 'urgente') return 'Urgente';
  if (v === 'alta' || v === 'high') return 'Alta';
  if (v === 'baixa' || v === 'low') return 'Baixa';
  return 'Média';
}

function mapCurrency(value: string): Currency {
  const v = value.toUpperCase().trim();
  if (v === 'USD' || v === 'US$' || v === '$') return 'USD';
  if (v === 'EUR' || v === '€') return 'EUR';
  if (v === 'GBP' || v === '£') return 'GBP';
  if (v === 'JPY' || v === '¥') return 'JPY';
  if (v === 'CNY') return 'CNY';
  return 'BRL';
}

function getValue(row: ParsedRow, mapping: ColumnMapping, field: string): string {
  const col = mapping[field];
  if (!col) return '';
  return row[col] ?? '';
}

export function mapRowToRequisition(
  row: ParsedRow,
  mapping: ColumnMapping
): Omit<Requisition, 'id' | 'createdAt' | 'updatedAt'> {
  const g = (field: string) => getValue(row, mapping, field);

  const statusRaw = g('status');
  const criticalityRaw = g('criticality');

  return {
    rc: g('rc'),
    project: g('project'),
    item: g('item'),
    category: g('category'),
    supplier: g('supplier'),
    status: statusRaw ? mapStatus(statusRaw) : 'Em cotação',
    criticality: criticalityRaw ? mapCriticality(criticalityRaw) : 'Média',
    omieInclusion: parseDate(g('omieInclusion')),
    omieApproval: parseDate(g('omieApproval')),
    invoiceValue: parseNumber(g('invoiceValue')),
    invoiceNumber: g('invoiceNumber'),
    paymentMethod: g('paymentMethod'),
    dueDate1: parseDate(g('dueDate1')),
    dueDate2: parseDate(g('dueDate2')),
    dueDate3: parseDate(g('dueDate3')),
    quotationInclusion: parseDate(g('quotationInclusion')),
    sentForApproval: parseDate(g('sentForApproval')),
    deliveryForecast: parseDate(g('deliveryForecast')),
    poSent: parseDate(g('poSent')),
    quotedBy: g('quotedBy'),
    quotedSupplier: g('quotedSupplier'),
    adtInvoice: g('adtInvoice'),
    observations: g('observations'),
    freight: false,
    freightValue: 0,
    freightStatus: '',
    freightCompany: '',
    dismemberedRc: '',
    updateDate: new Date().toISOString().split('T')[0],
    quotationDeadline: '',
    quotationType: 'Simples',
  };
}

export function mapRowToPurchaseOrder(
  row: ParsedRow,
  mapping: ColumnMapping
): Omit<PurchaseOrderItem, 'id' | 'createdAt' | 'updatedAt'> {
  const g = (field: string) => getValue(row, mapping, field);

  const statusRaw = g('status');
  const moedaRaw = g('moeda');

  return {
    numeroPo: g('numeroPo'),
    descricaoItem: g('descricaoItem'),
    codItem: g('codItem'),
    ncm: g('ncm'),
    quantidade: parseNumber(g('quantidade')),
    quantidadeEntregue: parseNumber(g('quantidadeEntregue')),
    valorUnitario: parseNumber(g('valorUnitario')),
    moeda: moedaRaw ? mapCurrency(moedaRaw) : 'BRL',
    dataPo: parseDate(g('dataPo')),
    dataEntrega: parseDate(g('dataEntrega')),
    condicoesPagamento: g('condicoesPagamento'),
    garantia: g('garantia'),
    status: statusRaw ? mapPOStatus(statusRaw) : 'Pedido',
    observacoes: g('observacoes'),
    ultimaAtualizacao: new Date().toISOString().split('T')[0],
    requisitionId: '',
  };
}

export function validateRequisitionRow(
  data: Omit<Requisition, 'id' | 'createdAt' | 'updatedAt'>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.rc || data.rc.trim() === '') {
    errors.push('RC é obrigatório');
  }

  if (!data.item || data.item.trim() === '') {
    warnings.push('Descrição do item está vazia');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validatePurchaseOrderRow(
  data: Omit<PurchaseOrderItem, 'id' | 'createdAt' | 'updatedAt'>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.numeroPo || data.numeroPo.trim() === '') {
    errors.push('Número do PO é obrigatório');
  }

  if (!data.descricaoItem || data.descricaoItem.trim() === '') {
    errors.push('Descrição do Item é obrigatória');
  }

  return { valid: errors.length === 0, errors, warnings };
}
