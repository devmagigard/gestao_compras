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
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}