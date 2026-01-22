import * as XLSX from 'xlsx';
import { PurchaseOrderItem } from '../types';
import { formatDate } from './formatters';
import { CURRENCY_SYMBOLS } from './constants';

export function exportProductsToCSV(items: PurchaseOrderItem[]): string {
  const headers = [
    'NUMERO PO',
    'ULTIMA ATUALIZACAO',
    'DATA PO',
    'COD ITEM',
    'DESCRICAO DO ITEM',
    'NCM',
    'GARANTIA',
    'QTD',
    'QTD ENTREGUE',
    'FALTA ENTREGAR',
    'VALOR UNIT',
    'MOEDA',
    'CONDICOES DE PAGAMENTO',
    'DATA ENTREGA',
    'STATUS',
    'OBS'
  ];

  const rows = items.map(item => {
    const remaining = item.quantidade - item.quantidadeEntregue;
    return [
      item.numeroPo,
      formatDate(item.ultimaAtualizacao),
      formatDate(item.dataPo),
      item.codItem,
      item.descricaoItem,
      item.ncm,
      item.garantia,
      item.quantidade,
      item.quantidadeEntregue,
      remaining,
      item.valorUnitario,
      item.moeda,
      item.condicoesPagamento,
      formatDate(item.dataEntrega),
      item.status,
      item.observacoes
    ];
  });

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

  return csvContent;
}

export function exportProductsToExcel(items: PurchaseOrderItem[]): void {
  const formatCurrencyValue = (value: number, currency: string) => {
    const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency;
    return `${symbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const data = items.map(item => {
    const remaining = item.quantidade - item.quantidadeEntregue;
    const totalValue = item.valorUnitario * item.quantidade;

    return {
      'Número PO': item.numeroPo,
      'Última Atualização': formatDate(item.ultimaAtualizacao),
      'Data PO': formatDate(item.dataPo),
      'Código Item': item.codItem,
      'Descrição': item.descricaoItem,
      'NCM': item.ncm,
      'Garantia': item.garantia,
      'Quantidade': item.quantidade,
      'Qtd Entregue': item.quantidadeEntregue,
      'Falta Entregar': remaining,
      'Valor Unitário': formatCurrencyValue(item.valorUnitario, item.moeda),
      'Valor Total': formatCurrencyValue(totalValue, item.moeda),
      'Moeda': item.moeda,
      'Condições Pagamento': item.condicoesPagamento,
      'Data Entrega': formatDate(item.dataEntrega),
      'Status': item.status,
      'Observações': item.observacoes
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  const columnWidths = [
    { wch: 15 }, // Número PO
    { wch: 16 }, // Última Atualização
    { wch: 12 }, // Data PO
    { wch: 15 }, // Código Item
    { wch: 40 }, // Descrição
    { wch: 12 }, // NCM
    { wch: 15 }, // Garantia
    { wch: 10 }, // Quantidade
    { wch: 12 }, // Qtd Entregue
    { wch: 15 }, // Falta Entregar
    { wch: 15 }, // Valor Unitário
    { wch: 15 }, // Valor Total
    { wch: 8 },  // Moeda
    { wch: 20 }, // Condições Pagamento
    { wch: 12 }, // Data Entrega
    { wch: 20 }, // Status
    { wch: 30 }  // Observações
  ];

  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');

  XLSX.writeFile(workbook, `produtos_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportProductTemplate(): void {
  const headers = [
    'Número PO',
    'Última Atualização',
    'Data PO',
    'Código Item',
    'Descrição',
    'NCM',
    'Garantia',
    'Quantidade',
    'Qtd Entregue',
    'Valor Unitário',
    'Moeda',
    'Condições Pagamento',
    'Data Entrega',
    'Status',
    'Observações',
    'ID Requisição'
  ];

  const exampleData = [
    {
      'Número PO': 'PO-2024-001',
      'Última Atualização': '2024-01-22',
      'Data PO': '2024-01-15',
      'Código Item': 'ITEM-001',
      'Descrição': 'Exemplo de produto para importação',
      'NCM': '12345678',
      'Garantia': '12 meses',
      'Quantidade': 10,
      'Qtd Entregue': 0,
      'Valor Unitário': 100.00,
      'Moeda': 'BRL',
      'Condições Pagamento': '30/60/90 dias',
      'Data Entrega': '2024-02-15',
      'Status': 'Pedido',
      'Observações': 'Observações opcionais',
      'ID Requisição': ''
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet([...exampleData], { header: headers });

  const columnWidths = [
    { wch: 15 },
    { wch: 16 },
    { wch: 12 },
    { wch: 15 },
    { wch: 40 },
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 12 },
    { wch: 15 },
    { wch: 8 },
    { wch: 20 },
    { wch: 12 },
    { wch: 20 },
    { wch: 30 },
    { wch: 15 }
  ];

  worksheet['!cols'] = columnWidths;

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!worksheet[address]) continue;
    worksheet[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'CCCCCC' } }
    };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Produtos');

  XLSX.writeFile(workbook, `template_produtos_${new Date().toISOString().split('T')[0]}.xlsx`);
}
