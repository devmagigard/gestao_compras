import { RequisitionStatus, Criticality, QuotationType } from '../types';

export const REQUISITION_STATUSES: RequisitionStatus[] = [
  'Em cotação',
  'Ag.Fatura',
  'Ag.Entrega',
  'Ag.Pagamento',
  'Concluído',
  'Faturado',
  'Entregue',
  'Em Aprovação',
  'Em Requisição'
];

export const CRITICALITY_LEVELS: Criticality[] = [
  'Urgente',
  'Alta',
  'Média',
  'Baixa'
];

export const QUOTATION_TYPES: QuotationType[] = [
  'Simples',
  'Complexa'
];

export const STATUS_COLORS = {
  'Em cotação': 'bg-blue-100 text-blue-800',
  'Ag.Fatura': 'bg-yellow-100 text-yellow-800',
  'Ag.Entrega': 'bg-cyan-100 text-cyan-800',
  'Ag.Pagamento': 'bg-purple-100 text-purple-800',
  'Concluído': 'bg-green-100 text-green-800',
  'Faturado': 'bg-purple-100 text-purple-800',
  'Entregue': 'bg-emerald-100 text-emerald-800',
  'Em Aprovação': 'bg-orange-100 text-orange-800',
  'Em Requisição': 'bg-indigo-100 text-indigo-800'
};

export const CRITICALITY_COLORS = {
  'Urgente': 'bg-red-100 text-red-800',
  'Alta': 'bg-orange-100 text-orange-800',
  'Média': 'bg-yellow-100 text-yellow-800',
  'Baixa': 'bg-green-100 text-green-800'
};

// Categorias comuns para sugestões
export const COMMON_CATEGORIES = [
  'Serviços Profissionais',
  'Componentes Eólicos',
  'Numerário',
  'Equipamentos',
  'Materiais',
  'Serviços',
  'Ferramentas',
  'Consumíveis',
  'Peças de Reposição',
  'Software',
  'Hardware',
  'Manutenção',
  'Limpeza',
  'Segurança',
  'Escritório',
  'Transporte',
  'Hospedagem',
  'Alimentação'
];