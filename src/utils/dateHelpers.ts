/**
 * Adiciona dias a uma data
 * @param date - Data base (string no formato YYYY-MM-DD ou objeto Date)
 * @param days - Número de dias a adicionar
 * @returns String da data no formato YYYY-MM-DD
 */
export function addDays(date: string | Date, days: number): string {
  const baseDate = typeof date === 'string' ? new Date(date) : date;
  const newDate = new Date(baseDate);
  newDate.setDate(newDate.getDate() + days);
  return newDate.toISOString().split('T')[0];
}

/**
 * Obtém a data atual no formato YYYY-MM-DD
 * @returns String da data atual
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Formata uma data para o formato brasileiro (dd/mm/yyyy)
 * @param dateString - String da data no formato YYYY-MM-DD
 * @returns String da data no formato dd/mm/yyyy
 */
export function formatDateToBrazilian(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Validate date components
    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      return '';
    }
    
    const formattedDay = day.toString().padStart(2, '0');
    const formattedMonth = month.toString().padStart(2, '0');
    
    return `${formattedDay}/${formattedMonth}/${year}`;
  } catch {
    return '';
  }
}

/**
 * Converte data do formato brasileiro (dd/mm/yyyy) para formato ISO (yyyy-mm-dd)
 * @param brazilianDate - String da data no formato dd/mm/yyyy
 * @returns String da data no formato yyyy-mm-dd
 */
export function convertBrazilianToISO(brazilianDate: string): string {
  if (!brazilianDate) return '';
  
  try {
    const [day, month, year] = brazilianDate.split('/').map(Number);
    
    // Validate date components
    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      return '';
    }
    
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    
    return `${year}-${formattedMonth}-${formattedDay}`;
  } catch {
    return '';
  }
}

/**
 * Converte data do formato ISO (yyyy-mm-dd) para formato brasileiro (dd/mm/yyyy)
 * @param isoDate - String da data no formato yyyy-mm-dd
 * @returns String da data no formato dd/mm/yyyy
 */
export function convertISOToBrazilian(isoDate: string): string {
  if (!isoDate) return '';
  
  try {
    const [year, month, day] = isoDate.split('-').map(Number);
    
    // Validate date components
    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      return '';
    }
    
    const formattedDay = day.toString().padStart(2, '0');
    const formattedMonth = month.toString().padStart(2, '0');
    
    return `${formattedDay}/${formattedMonth}/${year}`;
  } catch {
    return '';
  }
}

/**
 * Normaliza uma data para o formato ISO, aceitando tanto formato brasileiro quanto ISO
 * @param dateValue - String da data em qualquer formato
 * @returns String da data no formato yyyy-mm-dd
 */
export function normalizeDateToISO(dateValue: string): string {
  if (!dateValue) return '';
  
  // Se já está no formato ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  
  // Se está no formato brasileiro
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
    return convertBrazilianToISO(dateValue);
  }
  
  return '';
}
/**
 * Cria um objeto Date a partir de uma string YYYY-MM-DD garantindo timezone local
 * @param dateString - String da data no formato YYYY-MM-DD
 * @returns Objeto Date no timezone local
 */
export function createLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Parse manual para evitar problemas de timezone
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Criar data no timezone local (month é 0-indexed no JavaScript)
  return new Date(year, month - 1, day);
}

/**
 * Verifica se uma data é válida
 * @param dateString - String da data no formato YYYY-MM-DD
 * @returns Boolean indicando se a data é válida
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  
  // Verificar formato YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  
  const date = new Date(dateString + 'T00:00:00');
  return !isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100;
}

/**
 * Calcula a data de término da garantia baseada na data de início e período
 * @param startDate - Data de início da garantia (YYYY-MM-DD)
 * @param warrantyPeriod - Período da garantia (ex: "12 meses", "1 ano", "24 months")
 * @returns Data de término da garantia (YYYY-MM-DD) ou null se inválido
 */
export function calculateWarrantyEndDate(startDate: string, warrantyPeriod: string): string | null {
  console.log('[calculateWarrantyEndDate] Input:', { startDate, warrantyPeriod });

  if (!startDate || !warrantyPeriod) {
    console.log('[calculateWarrantyEndDate] Missing input');
    return null;
  }

  // Validar a data de início
  if (!isValidDate(startDate)) {
    console.log('[calculateWarrantyEndDate] Invalid date:', startDate);
    return null;
  }

  // Normalizar o período removendo acentos e convertendo para minúsculas
  const cleanPeriod = warrantyPeriod
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos

  console.log('[calculateWarrantyEndDate] Clean period:', cleanPeriod);

  // Extrair número do período
  const numberMatch = cleanPeriod.match(/(\d+)/);
  if (!numberMatch) {
    console.log('[calculateWarrantyEndDate] No number found');
    return null;
  }

  const periodNumber = parseInt(numberMatch[1], 10);
  if (isNaN(periodNumber) || periodNumber <= 0) {
    console.log('[calculateWarrantyEndDate] Invalid number:', periodNumber);
    return null;
  }

  const startDateObj = createLocalDate(startDate);
  let endDate = new Date(startDateObj);

  // Determinar a unidade de tempo (mais robusto, aceita plural/singular)
  if (cleanPeriod.includes('ano') || cleanPeriod.includes('year')) {
    endDate.setFullYear(endDate.getFullYear() + periodNumber);
  } else if (
    cleanPeriod.includes('mes') ||
    cleanPeriod.includes('month') ||
    cleanPeriod.includes('mese') // Para capturar "meses"
  ) {
    endDate.setMonth(endDate.getMonth() + periodNumber);
  } else if (cleanPeriod.includes('dia') || cleanPeriod.includes('day')) {
    endDate.setDate(endDate.getDate() + periodNumber);
  } else if (cleanPeriod.includes('semana') || cleanPeriod.includes('week')) {
    endDate.setDate(endDate.getDate() + (periodNumber * 7));
  } else {
    // Padrão: assumir meses se não especificado (apenas número)
    endDate.setMonth(endDate.getMonth() + periodNumber);
  }

  // Retornar no formato YYYY-MM-DD
  const year = endDate.getFullYear();
  const month = String(endDate.getMonth() + 1).padStart(2, '0');
  const day = String(endDate.getDate()).padStart(2, '0');

  const result = `${year}-${month}-${day}`;
  console.log('[calculateWarrantyEndDate] Result:', result);
  return result;
}

/**
 * Calcula a diferença em dias entre duas datas
 * @param date1 - Primeira data (YYYY-MM-DD)
 * @param date2 - Segunda data (YYYY-MM-DD)
 * @returns Diferença em dias (date2 - date1) ou null se inválido
 */
export function getDaysDifference(date1: string, date2: string): number | null {
  if (!date1 || !date2 || !isValidDate(date1) || !isValidDate(date2)) {
    return null;
  }

  const dateObj1 = createLocalDate(date1);
  const dateObj2 = createLocalDate(date2);
  
  dateObj1.setHours(0, 0, 0, 0);
  dateObj2.setHours(0, 0, 0, 0);

  const diffTime = dateObj2.getTime() - dateObj1.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Calcula os dias restantes de garantia
 * @param warrantyEndDate - Data de término da garantia (YYYY-MM-DD)
 * @returns Dias restantes (positivo = ativa, negativo = expirada) ou null se inválido
 */
export function getWarrantyDaysRemaining(warrantyEndDate: string): number | null {
  if (!warrantyEndDate || !isValidDate(warrantyEndDate)) {
    return null;
  }

  const today = getCurrentDate();
  return getDaysDifference(today, warrantyEndDate);
}