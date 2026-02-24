export interface Requisition {
  id: string;
  rc: string;
  project: string;
  category: string;
  item: string;
  freight: boolean;
  supplier: string;
  observations: string;
  poSent: string;
  status: RequisitionStatus;
  updateDate: string;
  adtInvoice: string;
  quotationDeadline: string;
  omieInclusion: string;
  deliveryForecast: string;
  quotationInclusion: string;
  sentForApproval: string;
  omieApproval: string;
  criticality: Criticality;
  dismemberedRc: string;
  invoiceValue: number;
  invoiceNumber: string;
  paymentMethod: string;
  dueDate1: string;
  dueDate2: string;
  dueDate3: string;
  quotedBy: string;
  freightValue: number;
  freightStatus: string;
  freightCompany: string;
  quotedSupplier: string;
  quotationType: QuotationType;
  createdAt: string;
  updatedAt: string;
}

export type RequisitionStatus = 
  | 'Em cotação'
  | 'Ag.Fatura'
  | 'Ag.Entrega'
  | 'Ag.Pagamento'
  | 'Concluído'
  | 'Faturado'
  | 'Entregue'
  | 'Em Aprovação'
  | 'Em Requisição';

export type Criticality = 'Alta' | 'Média' | 'Baixa' | 'Urgente';

export type QuotationType = 'Simples' | 'Complexa';

export interface FilterState {
  rcSearch: string;
  projectSearch: string;
  productSearch: string;
  statusSearch: string;
  freightFilter?: 'all' | 'with' | 'without';
  attentionFilter?: 'all' | 'delayed' | 'upcoming' | 'attention';
}

export interface DashboardMetrics {
  totalRequisitions: number;
  pendingApproval: number;
  inQuotation: number;
  completed: number;
  waitingForInvoice: number;
  waitingForDelivery: number;
  totalValue: number;
  urgentItems: number;
  delayedDeliveries: number;
  upcomingDeliveries: number;
}

export interface PurchaseOrderItem {
  id: string;
  numeroPo: string;
  ultimaAtualizacao: string;
  dataPo: string;
  codItem: string;
  descricaoItem: string;
  ncm: string;
  garantia: string;
  quantidade: number;
  quantidadeEntregue: number;
  valorUnitario: number;
  moeda: Currency;
  condicoesPagamento: string;
  dataEntrega: string;
  status: PurchaseOrderStatus;
  observacoes: string;
  requisitionId: string;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderStatus =
  | 'Pedido'
  | 'Em Trânsito'
  | 'Parcialmente Entregue'
  | 'Entregue'
  | 'Cancelado'
  | 'Aguardando Fornecedor';

export type Currency = 'BRL' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY';

export interface PurchaseOrderFilterState {
  poSearch: string;
  itemCodeSearch: string;
  itemDescriptionSearch: string;
  statusSearch: string;
  currencyFilter?: Currency | 'all';
  deliveryFilter?: 'all' | 'delayed' | 'upcoming' | 'attention';
}

export interface PurchaseOrderMetrics {
  totalItems: number;
  pendingDelivery: number;
  partiallyDelivered: number;
  completed: number;
  totalValue: number;
  delayedDeliveries: number;
  upcomingDeliveries: number;
}