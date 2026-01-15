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
