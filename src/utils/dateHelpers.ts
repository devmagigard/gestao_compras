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