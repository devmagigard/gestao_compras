import * as XLSX from 'xlsx';
import { Requisition } from '../types';

/**
 * Exporta requisições para formato Excel (.xlsx)
 * @param requisitions - Array de requisições para exportar
 * @returns void - Faz download do arquivo automaticamente
 */
export function exportToExcel(requisitions: Requisition[]): void {
  // Preparar os dados para o Excel
  const excelData = requisitions.map(req => ({
    'RC': req.rc,
    'PROJETO': req.project,
    'CATEGORIA': req.category || '',
    'ITEM': req.item,
    'FRETE': req.freight ? 'Sim' : 'Não',
    'FORNECEDOR': req.supplier || '',
    'OBSERVAÇÕES': req.observations || '',
    'ENVIADO PO': req.poSent || '',
    'STATUS': req.status,
    'DATA ATUALIZAÇÃO': req.updateDate || '',
    'ADT / FATURA': req.adtInvoice || '',
    'PRAZO COTAÇÃO': req.quotationDeadline || '',
    'INCLUSÃO OMIE': req.omieInclusion || '',
    'PREVISÃO DE ENTREGA': req.deliveryForecast || '',
    'INCLUSÃO PARA COTAÇÃO': req.quotationInclusion || '',
    'ENVIADO P/ APROVAÇÃO': req.sentForApproval || '',
    'APROVAÇÃO OMIE': req.omieApproval || '',
    'CRITICIDADE': req.criticality,
    'RC DESMEMBRADO': req.dismemberedRc || '',
    'VALOR NF': req.invoiceValue || 0,
    'NF': req.invoiceNumber || '',
    'FORMA DE PAG.': req.paymentMethod || '',
    'VENCIMENTO PARC1': req.dueDate1 || '',
    'VENCIMENTO PARC2': req.dueDate2 || '',
    'VENCIMENTO PARC3': req.dueDate3 || '',
    'COTADO POR': req.quotedBy || '',
    'VALOR DO FRETE': req.freightValue || 0,
    'STATUS FRETE': req.freightStatus || '',
    'TRANSPORTADORA': req.freightCompany || '',
    'COTADO FORNECEDOR': req.quotedSupplier || '',
    'TIPO COTAÇÃO': req.quotationType
  }));

  // Criar workbook e worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Configurar larguras das colunas para melhor visualização
  const columnWidths = [
    { wch: 12 }, // RC
    { wch: 15 }, // PROJETO
    { wch: 20 }, // CATEGORIA
    { wch: 40 }, // ITEM
    { wch: 8 },  // FRETE
    { wch: 25 }, // FORNECEDOR
    { wch: 30 }, // OBSERVAÇÕES
    { wch: 12 }, // ENVIADO PO
    { wch: 15 }, // STATUS
    { wch: 15 }, // DATA ATUALIZAÇÃO
    { wch: 15 }, // ADT / FATURA
    { wch: 15 }, // PRAZO COTAÇÃO
    { wch: 15 }, // INCLUSÃO OMIE
    { wch: 18 }, // PREVISÃO DE ENTREGA
    { wch: 20 }, // INCLUSÃO PARA COTAÇÃO
    { wch: 20 }, // ENVIADO P/ APROVAÇÃO
    { wch: 15 }, // APROVAÇÃO OMIE
    { wch: 12 }, // CRITICIDADE
    { wch: 15 }, // RC DESMEMBRADO
    { wch: 15 }, // VALOR NF
    { wch: 15 }, // NF
    { wch: 18 }, // FORMA DE PAG.
    { wch: 15 }, // VENCIMENTO PARC1
    { wch: 15 }, // VENCIMENTO PARC2
    { wch: 15 }, // VENCIMENTO PARC3
    { wch: 20 }, // COTADO POR
    { wch: 15 }, // VALOR DO FRETE
    { wch: 15 }, // STATUS FRETE
    { wch: 20 }, // TRANSPORTADORA
    { wch: 25 }, // COTADO FORNECEDOR
    { wch: 15 }  // TIPO COTAÇÃO
  ];

  worksheet['!cols'] = columnWidths;

  // Adicionar formatação para valores monetários
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let row = 1; row <= range.e.r; row++) {
    // Coluna T (VALOR NF) - índice 19
    const valorNfCell = XLSX.utils.encode_cell({ r: row, c: 19 });
    if (worksheet[valorNfCell] && typeof worksheet[valorNfCell].v === 'number') {
      worksheet[valorNfCell].z = '"R$" #,##0.00';
    }
    
    // Coluna Z (VALOR DO FRETE) - índice 25
    const valorFreteCell = XLSX.utils.encode_cell({ r: row, c: 25 });
    if (worksheet[valorFreteCell] && typeof worksheet[valorFreteCell].v === 'number') {
      worksheet[valorFreteCell].z = '"R$" #,##0.00';
    }
  }

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Requisições');

  // Gerar nome do arquivo com data atual
  const today = new Date().toISOString().split('T')[0];
  const filename = `requisicoes_${today}.xlsx`;

  // Fazer download do arquivo
  XLSX.writeFile(workbook, filename);
}

/**
 * Exporta requisições para formato CSV (mantém compatibilidade)
 * @param requisitions - Array de requisições para exportar
 * @returns string - Conteúdo CSV
 */
export function exportToCSV(requisitions: Requisition[]): string {
  const headers = [
    'RC', 'PROJETO', 'CATEGORIA', 'ITEM', 'FRETE', 'FORNECEDOR', 'OBS',
    'ENVIADO PO', 'STATUS', 'DATA ATUALIZAÇÃO', 'ADT / FATURA',
    'PRAZO COTAÇÃO', 'INCLUSÃO OMIE', 'PREVISÃO DE ENTREGA',
    'INCLUSÃO PARA COTAÇÃO', 'ENVIADO P/ APROVAÇÃO', 'APROVAÇÃO OMIE',
    'CRITICIDADE', 'RC DESMEMBRADO', 'VALOR NF', 'NF', 'FORMA DE PAG.',
    'VENCIMENTO PARC1', 'VENCIMENTO PARC2', 'VENCIMENTO PARC3',
    'COTADO POR', 'VALOR DO FRETE', 'STATUS FRETE', 'TRANSPORTADORA', 'COTADO FORNECEDOR',
    'TIPO COTAÇÃO'
  ];
  
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'sim' : 'não';
    if (typeof value === 'number') return value.toString();
    return value.toString();
  };
  
  const csvContent = [
    headers.join(';'),
    ...requisitions.map(req => [
      req.rc, req.project, req.category, req.item,
      req.freight ? 'sim' : 'não', req.supplier, req.observations,
      req.poSent, req.status, req.updateDate, req.adtInvoice,
      req.quotationDeadline, req.omieInclusion, req.deliveryForecast,
      req.quotationInclusion, req.sentForApproval, req.omieApproval,
      req.criticality, req.dismemberedRc, formatValue(req.invoiceValue),
      req.invoiceNumber, req.paymentMethod, req.dueDate1, req.dueDate2,
      req.dueDate3, req.quotedBy, formatValue(req.freightValue),
      req.freightStatus, req.freightCompany, req.quotedSupplier, req.quotationType
    ].join(';'))
  ].join('\n');
  
  return csvContent;
}