import { PurchaseOrderItem } from '../types';

function parseExcelSerialDate(serial: number): string {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const date = new Date(utcValue * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  if (year >= 1900 && year <= 2100) {
    return `${year}-${month}-${day}`;
  }
  return '';
}

function parseDate(value: string | number | Date | undefined): string {
  if (value instanceof Date) {
    if (!isNaN(value.getTime()) && value.getFullYear() >= 1900 && value.getFullYear() <= 2100) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  }
  return parseDateInternal(value);
}

function parseDateInternal(value: string | number | undefined): string {
  if (value === undefined || value === null || value === '') return '';

  if (typeof value === 'number') {
    if (value > 1 && value < 200000) {
      return parseExcelSerialDate(value);
    }
    return '';
  }

  const str = String(value).trim();
  if (!str) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const date = new Date(str + 'T00:00:00');
    if (!isNaN(date.getTime()) && date.getFullYear() >= 1900) return str;
    return '';
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [day, month, year] = str.split('/');
    const formatted = `${year}-${month}-${day}`;
    const date = new Date(formatted + 'T00:00:00');
    if (!isNaN(date.getTime())) return formatted;
    return '';
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [month, day, year] = str.split('/');
    const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const date = new Date(formatted + 'T00:00:00');
    if (!isNaN(date.getTime())) return formatted;
    return '';
  }

  try {
    const d = new Date(str.includes('T') ? str : str + 'T00:00:00');
    if (!isNaN(d.getTime()) && d.getFullYear() >= 1900 && d.getFullYear() <= 2100) {
      return d.toISOString().split('T')[0];
    }
  } catch {
    // ignore
  }

  return '';
}

function parseNumeric(value: string | number | undefined, defaultValue = 0): number {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'number') return isNaN(value) ? defaultValue : value;
  const clean = String(value).replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? defaultValue : parsed;
}

function mapStatus(value: string): string {
  const statusMap: Record<string, string> = {
    'pedido': 'Pedido',
    'em trânsito': 'Em Trânsito',
    'em transito': 'Em Trânsito',
    'parcialmente entregue': 'Parcialmente Entregue',
    'entregue': 'Entregue',
    'cancelado': 'Cancelado',
    'aguardando fornecedor': 'Aguardando Fornecedor'
  };
  return statusMap[value.toLowerCase().trim()] || 'Pedido';
}

const HEADER_ALIASES: Record<string, string> = {
  'numero po': 'numeroPo',
  'número po': 'numeroPo',
  'num po': 'numeroPo',
  'nro po': 'numeroPo',
  'po': 'numeroPo',

  'ultima atualizacao': 'ultimaAtualizacao',
  'última atualização': 'ultimaAtualizacao',
  'ultima atualização': 'ultimaAtualizacao',
  'última atualizacao': 'ultimaAtualizacao',
  'atualização': 'ultimaAtualizacao',
  'atualizacao': 'ultimaAtualizacao',

  'data po': 'dataPo',
  'data do po': 'dataPo',

  'cod item': 'codItem',
  'código item': 'codItem',
  'codigo item': 'codItem',
  'cod. item': 'codItem',
  'cód item': 'codItem',
  'cód. item': 'codItem',

  'descricao': 'descricaoItem',
  'descrição': 'descricaoItem',
  'descricao do item': 'descricaoItem',
  'descrição do item': 'descricaoItem',
  'descricao item': 'descricaoItem',
  'descrição item': 'descricaoItem',

  'ncm': 'ncm',

  'garantia': 'garantia',

  'quantidade': 'quantidade',
  'qtd': 'quantidade',
  'qty': 'quantidade',

  'qtd entregue': 'quantidadeEntregue',
  'quantidade entregue': 'quantidadeEntregue',

  'valor unitario': 'valorUnitario',
  'valor unitário': 'valorUnitario',
  'valor unit': 'valorUnitario',
  'preco unitario': 'valorUnitario',
  'preço unitário': 'valorUnitario',

  'moeda': 'moeda',
  'currency': 'moeda',

  'condicoes pagamento': 'condicoesPagamento',
  'condições pagamento': 'condicoesPagamento',
  'condicoes de pagamento': 'condicoesPagamento',
  'condições de pagamento': 'condicoesPagamento',
  'cond pagamento': 'condicoesPagamento',

  'data entrega': 'dataEntrega',
  'data de entrega': 'dataEntrega',
  'prazo entrega': 'dataEntrega',

  'status': 'status',

  'observacoes': 'observacoes',
  'observações': 'observacoes',
  'obs': 'observacoes',
  'observacao': 'observacoes',
  'observação': 'observacoes',

  'id requisicao': 'requisitionId',
  'id requisição': 'requisitionId',
  'requisition id': 'requisitionId',
  'requisicao': 'requisitionId',
  'requisição': 'requisitionId',
};

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveHeader(raw: string): string | null {
  const normalized = normalizeHeader(raw);
  if (HEADER_ALIASES[normalized]) return HEADER_ALIASES[normalized];

  for (const [alias, field] of Object.entries(HEADER_ALIASES)) {
    if (normalizeHeader(alias) === normalized) return field;
  }

  const rawLower = raw.toLowerCase().trim();
  if (HEADER_ALIASES[rawLower]) return HEADER_ALIASES[rawLower];

  return null;
}

export function parseProductCSVData(csvData: string): PurchaseOrderItem[] {
  const lines = csvData.split('\n').filter(line => line.trim() !== '');

  if (lines.length < 2) {
    throw new Error('Arquivo deve conter pelo menos um cabeçalho e uma linha de dados');
  }

  const rawHeaders = lines[0].split(';').map(h => h.trim().replace(/^"|"$/g, ''));
  const fieldMap: Record<number, string> = {};

  rawHeaders.forEach((raw, idx) => {
    const field = resolveHeader(raw);
    if (field) fieldMap[idx] = field;
  });

  console.log('Mapeamento de colunas:', fieldMap);

  const items: PurchaseOrderItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim()) continue;

    const values = rawLine.split(';').map(v => v.trim().replace(/^"|"$/g, ''));

    const row: Record<string, string | number> = {};
    values.forEach((val, idx) => {
      if (fieldMap[idx]) row[fieldMap[idx]] = val;
    });

    const numeroPo = String(row['numeroPo'] || '').trim();
    const descricaoItem = String(row['descricaoItem'] || '').trim();
    const codItem = String(row['codItem'] || '').trim();

    if (!numeroPo || !descricaoItem) {
      console.warn(`Linha ${i + 1} ignorada: Número PO e Descrição são obrigatórios`);
      continue;
    }

    try {
      const item: Omit<PurchaseOrderItem, 'id' | 'createdAt' | 'updatedAt'> = {
        numeroPo,
        ultimaAtualizacao: parseDate(row['ultimaAtualizacao'] as string) || new Date().toISOString().split('T')[0],
        dataPo: parseDate(row['dataPo'] as string),
        codItem,
        descricaoItem,
        ncm: String(row['ncm'] || ''),
        garantia: String(row['garantia'] || ''),
        quantidade: parseNumeric(row['quantidade']),
        quantidadeEntregue: parseNumeric(row['quantidadeEntregue']),
        valorUnitario: parseNumeric(row['valorUnitario']),
        moeda: String(row['moeda'] || 'BRL') || 'BRL',
        condicoesPagamento: String(row['condicoesPagamento'] || ''),
        dataEntrega: parseDate(row['dataEntrega'] as string),
        status: mapStatus(String(row['status'] || 'Pedido')) as PurchaseOrderItem['status'],
        observacoes: String(row['observacoes'] || ''),
        requisitionId: String(row['requisitionId'] || '')
      };

      items.push(item as PurchaseOrderItem);
    } catch (err) {
      console.error(`Erro ao processar linha ${i + 1}:`, err);
      continue;
    }
  }

  if (items.length === 0) {
    throw new Error('Nenhum produto válido encontrado. Verifique se o arquivo contém Número PO e Descrição preenchidos.');
  }

  return items;
}

export function parseProductExcelRows(rows: Record<string, string | number | Date | undefined>[]): PurchaseOrderItem[] {
  if (!rows || rows.length === 0) {
    throw new Error('Planilha sem dados');
  }

  const items: PurchaseOrderItem[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const fieldRow: Record<string, string | number | Date> = {};
    for (const [key, val] of Object.entries(row)) {
      const field = resolveHeader(key);
      if (field && val !== undefined && val !== null) {
        fieldRow[field] = val as string | number | Date;
      }
    }

    const numeroPo = String(fieldRow['numeroPo'] || '').trim();
    const descricaoItem = String(fieldRow['descricaoItem'] || '').trim();
    const codItem = String(fieldRow['codItem'] || '').trim();

    if (!numeroPo || !descricaoItem) {
      console.warn(`Linha ${i + 2} ignorada: Número PO e Descrição são obrigatórios`);
      continue;
    }

    try {
      const item: Omit<PurchaseOrderItem, 'id' | 'createdAt' | 'updatedAt'> = {
        numeroPo,
        ultimaAtualizacao: parseDate(fieldRow['ultimaAtualizacao'] as string | number | Date) || new Date().toISOString().split('T')[0],
        dataPo: parseDate(fieldRow['dataPo'] as string | number | Date),
        codItem,
        descricaoItem,
        ncm: String(fieldRow['ncm'] || ''),
        garantia: String(fieldRow['garantia'] || ''),
        quantidade: parseNumeric(fieldRow['quantidade']),
        quantidadeEntregue: parseNumeric(fieldRow['quantidadeEntregue']),
        valorUnitario: parseNumeric(fieldRow['valorUnitario']),
        moeda: String(fieldRow['moeda'] || 'BRL') || 'BRL',
        condicoesPagamento: String(fieldRow['condicoesPagamento'] || ''),
        dataEntrega: parseDate(fieldRow['dataEntrega'] as string | number | Date),
        status: mapStatus(String(fieldRow['status'] || 'Pedido')) as PurchaseOrderItem['status'],
        observacoes: String(fieldRow['observacoes'] || ''),
        requisitionId: String(fieldRow['requisitionId'] || '')
      };

      items.push(item as PurchaseOrderItem);
    } catch (err) {
      console.error(`Erro ao processar linha ${i + 2}:`, err);
      continue;
    }
  }

  if (items.length === 0) {
    throw new Error('Nenhum produto válido encontrado. Verifique se o arquivo contém Número PO e Descrição preenchidos.');
  }

  return items;
}
