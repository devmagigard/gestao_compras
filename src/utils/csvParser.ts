import { Requisition } from '../types';
import { normalizeProjectName } from './formatters';

// Função para corrigir problemas de encoding em caracteres portugueses
function fixEncoding(text: string): string {
  if (!text) return text;
  
  // Mapeamento de caracteres com problemas de encoding
  const encodingFixes: { [key: string]: string } = {
    // Caracteres acentuados comuns
    'Ã¡': 'á',
    'Ã ': 'à',
    'Ã¢': 'â',
    'Ã£': 'ã',
    'Ã¤': 'ä',
    'Ã©': 'é',
    'Ãª': 'ê',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ã´': 'ô',
    'Ãµ': 'õ',
    'Ãº': 'ú',
    'Ã§': 'ç',
    'Ã±': 'ñ',

    // Maiúsculas
    'Á': 'Á',
    'Ã€': 'À',
    'Ã‚': 'Â',
    'Ãƒ': 'Ã',
    'Ã„': 'Ä',
    'Ã‰': 'É',
    'ÃŠ': 'Ê',
    'Í': 'Í',
    'Ó': 'Ó',
    'Ô': 'Ô',
    'Ã•': 'Õ',
    'Ãš': 'Ú',
    'Ã‡': 'Ç',
    'Ñ': 'Ñ',

    // Outros caracteres especiais
    'â€™': "'",
    'â€œ': '"',
    'â€': '"',
    '–': '–',
    '—': '—',
    'Â°': '°',
    'Âª': 'ª',
    'Âº': 'º',

    // Caracteres com ? que são comuns
    'Ã?': 'ã',
    '?o': 'ão',
    '?a': 'ça',
    '?e': 'ãe',
    'defini?': 'definir',
    'cota?': 'cotação',
    'aprova?': 'aprovação',
    'inclus?': 'inclusão',
    'previs?': 'previsão',
    'requisi?': 'requisição',
    'observa?': 'observação',
    'informa?': 'informação'
  };
  
  let fixedText = text;

  // Aplicar correções de encoding
  for (const [wrong, correct] of Object.entries(encodingFixes)) {
    // Escapar caracteres especiais de regex
    const escapedWrong = wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    fixedText = fixedText.replace(new RegExp(escapedWrong, 'gi'), correct);
  }
  
  // Correções específicas para palavras comuns
  const wordFixes: { [key: string]: string } = {
    'cota??o': 'cotação',
    'cotacao': 'cotação',
    'aprova??o': 'aprovação',
    'aprovacao': 'aprovação',
    'inclus??o': 'inclusão',
    'inclusao': 'inclusão',
    'previs??o': 'previsão',
    'previsao': 'previsão',
    'requisi??o': 'requisição',
    'requisicao': 'requisição',
    'observa??o': 'observação',
    'observacao': 'observação',
    'informa??o': 'informação',
    'informacao': 'informação',
    'defini??o': 'definição',
    'definicao': 'definição',
    'á definir': 'A definir',
    'a definir': 'A definir',
    'grandes corretivas': 'Grandes Corretivas',
    'ferramentas para uso geral': 'Ferramentas para uso geral',
    'n??o': 'não',
    'nao': 'não',
    'sim': 'sim',
    'média': 'Média',
    'media': 'Média',
    'alta': 'Alta',
    'baixa': 'Baixa',
    'urgente': 'Urgente'
  };
  
  // Aplicar correções de palavras
  for (const [wrong, correct] of Object.entries(wordFixes)) {
    // Escapar caracteres especiais de regex
    const escapedWrong = wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    fixedText = fixedText.replace(new RegExp(escapedWrong, 'gi'), correct);
  }
  
  // Limpar múltiplos espaços (mas preservar quebras de linha)
  fixedText = fixedText
    .replace(/[ \t]+/g, ' ') // Múltiplos espaços/tabs para um só
    .replace(/[^\w\sÀ-ÿ.,;:()\-\/\r\n]/g, '') // Remove caracteres especiais inválidos mas mantém \r\n
    .trim();

  return fixedText;
}

export function parseCSVData(csvData: string): Requisition[] {
  try {
    // Primeiro, corrigir problemas de encoding no CSV inteiro
    const fixedCsvData = fixEncoding(csvData);
    console.log('CSV após correção de encoding:', fixedCsvData.substring(0, 300) + '...');

    // Dividir por diferentes tipos de quebras de linha (\r\n, \n, \r)
    const lines = fixedCsvData.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      throw new Error('Arquivo CSV deve conter pelo menos um cabeçalho e uma linha de dados');
    }
    
    const headers = lines[0].split(';');
    const requisitions: Requisition[] = [];
    
    console.log('Headers encontrados:', headers);
    console.log('Total de linhas:', lines.length);
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';');
      
      console.log(`Processando linha ${i + 1}:`, values);
      
      // Verificar se a linha tem dados suficientes
      if (values.length < 3 || !values[0]?.trim()) {
        console.warn(`Linha ${i + 1} ignorada: dados insuficientes`);
        continue;
      }
      
      try {
        // Função auxiliar para limpar e validar valores
        const getValue = (index: number, defaultValue: string = '') => {
          const value = values[index];
          const cleanValue = value !== undefined ? fixEncoding(value.trim()) : defaultValue;
          return cleanValue;
        };
        
        const getDateValue = (index: number) => {
          const value = getValue(index);
          if (!value) return '';
          
          // Verificar se já está no formato correto (YYYY-MM-DD)
          if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            // Validate the date is within reasonable range
            const date = new Date(value + 'T00:00:00');
            if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
              return value;
            }
            return '';
          }
          
          // Tentar converter formato DD/MM/YYYY para YYYY-MM-DD
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
            const [day, month, year] = value.split('/');
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);
            const dayNum = parseInt(day);
            
            // Validate date components
            if (yearNum >= 1900 && yearNum <= 2100 && 
                monthNum >= 1 && monthNum <= 12 && 
                dayNum >= 1 && dayNum <= 31) {
              const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              // Double check the date is valid
              const testDate = new Date(formattedDate + 'T00:00:00');
              if (!isNaN(testDate.getTime())) {
                return formattedDate;
              }
            }
            return '';
          }
          
          // Tentar outros formatos
          try {
            // Add time component to prevent timezone issues
            const dateWithTime = value.includes('T') ? value : value + 'T00:00:00';
            const date = new Date(dateWithTime);
            if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
              return date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.warn(`Data inválida na linha ${i + 1}: ${value}`);
          }
          
          return '';
        };
        
        const getNumericValue = (index: number, defaultValue: number = 0) => {
          const value = getValue(index);
          if (!value) return defaultValue;
          
          // Remover caracteres não numéricos exceto vírgula e ponto
          const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
          const parsed = parseFloat(cleanValue);
          return isNaN(parsed) ? defaultValue : parsed;
        };
        
        const getBooleanValue = (index: number) => {
          const value = getValue(index).toLowerCase();
          return value === 'sim' || value === 'true' || value === '1' || value === 'yes';
        };
        
        // Mapear status válidos
        const mapStatus = (status: string) => {
          const statusMap: { [key: string]: string } = {
            'em cotação': 'Em cotação',
            'em cotacao': 'Em cotação',
            'ag.fatura': 'Ag.Fatura',
            'aguardando fatura': 'Ag.Fatura',
            'ag.entrega': 'Ag.Entrega',
            'aguardando entrega': 'Ag.Entrega',
            'concluído': 'Concluído',
            'concluido': 'Concluído',
            'faturado': 'Faturado',
            'entregue': 'Entregue',
            'em aprovação': 'Em Aprovação',
            'em aprovacao': 'Em Aprovação',
            'solicitado': 'Solicitado',
            'em requisição': 'Em Requisição',
            'em requisicao': 'Em Requisição'
          };
          
          const normalizedStatus = status.toLowerCase().trim();
          return statusMap[normalizedStatus] || 'Em cotação';
        };
        
        // Mapear criticidade válida
        const mapCriticality = (criticality: string) => {
          const criticalityMap: { [key: string]: string } = {
            'urgente': 'Urgente',
            'alta': 'Alta',
            'média': 'Média',
            'media': 'Média',
            'baixa': 'Baixa'
          };
          
          const normalizedCriticality = criticality.toLowerCase().trim();
          return criticalityMap[normalizedCriticality] || 'Média';
        };
        
        // Mapear tipo de cotação
        const mapQuotationType = (type: string) => {
          const typeMap: { [key: string]: string } = {
            'simples': 'Simples',
            'complexa': 'Complexa',
            'complex': 'Complexa'
          };
          
          const normalizedType = type.toLowerCase().trim();
          return typeMap[normalizedType] || 'Simples';
        };
        
        // Criar objeto requisition com valores seguros
        const requisition: Omit<Requisition, 'id' | 'createdAt' | 'updatedAt'> = {
          rc: getValue(0),
          project: normalizeProjectName(getValue(1)),
          category: getValue(2),
          item: getValue(3),
          freight: getBooleanValue(4),
          supplier: getValue(5),
          observations: getValue(6),
          poSent: getDateValue(7),
          status: mapStatus(getValue(8, 'Em cotação')) as any,
          updateDate: getDateValue(9) || new Date().toISOString().split('T')[0],
          adtInvoice: getValue(10),
          quotationDeadline: getDateValue(11),
          omieInclusion: getDateValue(12),
          deliveryForecast: getDateValue(13),
          quotationInclusion: getDateValue(14),
          sentForApproval: getDateValue(15),
          omieApproval: getDateValue(16),
          criticality: mapCriticality(getValue(17, 'Média')) as any,
          dismemberedRc: getValue(18),
          invoiceValue: getNumericValue(19),
          invoiceNumber: getValue(20),
          paymentMethod: getValue(21),
          dueDate1: getDateValue(22),
          dueDate2: getDateValue(23),
          dueDate3: getDateValue(24),
          quotedBy: getValue(25),
          freightValue: getNumericValue(26),
          freightStatus: getValue(27),
          freightCompany: getValue(28),
          quotedSupplier: getValue(29),
          quotationType: mapQuotationType(getValue(30, 'Simples')) as any
        };
        
        // Validação básica
        if (!requisition.rc || !requisition.project || !requisition.item) {
          console.warn(`Linha ${i + 1} ignorada: campos obrigatórios em branco (RC, Projeto ou Item)`);
          continue;
        }
        
        console.log(`Requisição criada para linha ${i + 1}:`, requisition);
        requisitions.push(requisition as Requisition);
        
      } catch (error) {
        console.error(`Erro ao processar linha ${i + 1}:`, error);
        console.error('Valores da linha:', values);
        continue;
      }
    }
    
    if (requisitions.length === 0) {
      throw new Error('Nenhuma requisição válida foi encontrada no arquivo CSV');
    }
    
    console.log(`Total de requisições processadas: ${requisitions.length}`);
    return requisitions;
    
  } catch (error) {
    console.error('Erro geral no parseCSVData:', error);
    throw error;
  }
}