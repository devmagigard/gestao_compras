/**
 * Utility functions for formatting data
 */

/**
 * Formats a number as Brazilian currency (BRL)
 * @param value - The numeric value to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formats a date string to Brazilian format
 * @param dateString - The date string to format
 * @returns Formatted date string or '-' if invalid
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    // Parse date components manually to avoid timezone issues
    const dateOnly = dateString.split('T')[0]; // Get only the date part (YYYY-MM-DD)
    const [year, month, day] = dateOnly.split('-').map(Number);
    
    // Create date using local timezone constructor (year, month-1, day)
    // Month is 0-indexed in JavaScript Date constructor
    const localDate = new Date(year, month - 1, day);
    
    return localDate.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

/**
 * Normalizes project names to follow the PXXX format
 * @param projectName - The project name to normalize
 * @returns Normalized project name in PXXX format
 */
export function normalizeProjectName(projectName: string): string {
  if (!projectName) return '';
  
  // Remove espaços e converter para maiúsculo
  const cleaned = projectName.trim().toUpperCase();
  
  // Se já começa com P, retornar como está
  if (cleaned.startsWith('P')) {
    return cleaned;
  }
  
  // Se é apenas números, adicionar P na frente
  if (/^\d+$/.test(cleaned)) {
    return `P${cleaned}`;
  }
  
  // Se tem números no meio ou final, tentar extrair e adicionar P
  const numbers = cleaned.match(/\d+/);
  if (numbers) {
    return `P${numbers[0]}`;
  }
  
  // Se não tem números, retornar como está mas com P na frente
  return `P${cleaned}`;
}