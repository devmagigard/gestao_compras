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
  | 'Ag.Entrega'
  | 'Ag.Pagamento'
  | 'Concluído'
  | 'Entregue Parcialmente'
  | 'Em Aprovação'
  | 'Em Requisição';

export type Criticality = 'Alta' | 'Média' | 'Baixa' | 'Urgente';

export type QuotationType = 'Simples' | 'Complexa';

export interface FilterState {
  rcSearch: string;
  projectSearch: string;
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
  warrantyEndDate?: string;
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

export interface Quotation {
  id: string;
  requisitionId: string;
  supplierName: string;
  value: number;
  deliveryDays: number;
  paymentConditions: string;
  notes: string;
  isWinner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCatalog {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  unidadeMedida: string;
  ncm: string;
  observacoes: string;
  createdAt: string;
  updatedAt: string;
  suppliers?: ProductSupplier[];
  priceHistory?: ProductPriceHistory[];
  lastPrice?: ProductPriceHistory | null;
  supplierCount?: number;
}

export interface ProductSupplier {
  id: string;
  productCatalogId: string;
  nomeFornecedor: string;
  codigoFornecedor: string;
  ativo: boolean;
  observacoes: string;
  createdAt: string;
  updatedAt: string;
  lastPrice?: ProductPriceHistory | null;
}

export interface ProductPriceHistory {
  id: string;
  productCatalogId: string;
  productSupplierId: string | null;
  valor: number;
  moeda: string;
  dataReferencia: string;
  purchaseOrderItemId: string | null;
  requisitionId: string | null;
  fornecedorNome: string;
  numeroPo: string;
  origem: 'PO' | 'Cotacao' | 'Manual';
  observacoes: string;
  createdAt: string;
}

export interface CatalogFilterState {
  descricaoSearch: string;
  categoriaFilter: string;
  fornecedorFilter: string;
}

export interface CatalogMetrics {
  totalProducts: number;
  totalSuppliers: number;
  productsWithHistory: number;
  avgPrice: number;
}