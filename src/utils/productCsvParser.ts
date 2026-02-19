import { PurchaseOrderItem } from '../types';

function fixEncoding(text: string): string {
  if (!text) return text;

  const encodingFixes: { [key: string]: string } = {
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
    'â€™': "'",
    'â€œ': '"',
    'â€': '"',
    '–': '–',
    '—': '—',
    'Â°': '°',
    'Âª': 'ª',
    'Âº': 'º'
  };

  let fixedText = text;

  for (const [wrong, correct] of Object.entries(encodingFixes)) {
    fixedText = fixedText.replace(new RegExp(wrong, 'gi'), correct);
  }

  fixedText = fixedText
    .replace(/\s+/g, ' ')
    .replace(/[^\w\sÀ-ÿ.,;:()\-\/]/g, '')
    .trim();

  return fixedText;
}

export function parseProductCSVData(csvData: string): PurchaseOrderItem[] {
  try {
    const fixedCsvData = fixEncoding(csvData);
    const lines = fixedCsvData.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) {
      throw new Error('Arquivo CSV deve conter pelo menos um cabeçalho e uma linha de dados');
    }

    const headers = lines[0].split(';');
    const items: PurchaseOrderItem[] = [];

    console.log('Headers encontrados:', headers);
    console.log('Total de linhas:', lines.length);

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';');

      console.log(`Processando linha ${i + 1}:`, values);

      if (values.length < 3 || !values[0]?.trim()) {
        console.warn(`Linha ${i + 1} ignorada: dados insuficientes`);
        continue;
      }

      try {
        const getValue = (index: number, defaultValue: string = '') => {
          const value = values[index];
          const cleanValue = value !== undefined ? fixEncoding(value.trim()) : defaultValue;
          return cleanValue;
        };

        const getDateValue = (index: number) => {
          const value = getValue(index);
          if (!value) return '';

          if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const date = new Date(value + 'T00:00:00');
            if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
              return value;
            }
            return '';
          }

          if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
            const [day, month, year] = value.split('/');
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);
            const dayNum = parseInt(day);

            if (yearNum >= 1900 && yearNum <= 2100 &&
                monthNum >= 1 && monthNum <= 12 &&
                dayNum >= 1 && dayNum <= 31) {
              const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              const testDate = new Date(formattedDate + 'T00:00:00');
              if (!isNaN(testDate.getTime())) {
                return formattedDate;
              }
            }
            return '';
          }
          
          // Tentar converter formato MM/DD/YYYY (formato americano) para YYYY-MM-DD
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
            const [month, day, year] = value.split('/');
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

          try {
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

          const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
          const parsed = parseFloat(cleanValue);
          return isNaN(parsed) ? defaultValue : parsed;
        };

        const mapStatus = (status: string) => {
          const statusMap: { [key: string]: string } = {
            'pedido': 'Pedido',
            'em trânsito': 'Em Trânsito',
            'em transito': 'Em Trânsito',
            'parcialmente entregue': 'Parcialmente Entregue',
            'entregue': 'Entregue',
            'cancelado': 'Cancelado',
            'aguardando fornecedor': 'Aguardando Fornecedor'
          };

          const normalizedStatus = status.toLowerCase().trim();
          return statusMap[normalizedStatus] || 'Pedido';
        };

        const item: Omit<PurchaseOrderItem, 'id' | 'createdAt' | 'updatedAt'> = {
          numeroPo: getValue(0),
          ultimaAtualizacao: getDateValue(1) || new Date().toISOString().split('T')[0],
          dataPo: getDateValue(2),
          codItem: getValue(3),
          descricaoItem: getValue(4),
          ncm: getValue(5),
          garantia: getValue(6),
          quantidade: getNumericValue(7),
          quantidadeEntregue: getNumericValue(8),
          valorUnitario: getNumericValue(9),
          moeda: getValue(10, 'BRL'),
          condicoesPagamento: getValue(11),
          dataEntrega: getDateValue(12),
          status: mapStatus(getValue(13, 'Pedido')) as any,
          observacoes: getValue(14),
          requisitionId: getValue(15)
        };

        if (!item.numeroPo || !item.codItem || !item.descricaoItem) {
          console.warn(`Linha ${i + 1} ignorada: campos obrigatórios em branco`);
          continue;
        }

        console.log(`Produto criado para linha ${i + 1}:`, item);
        items.push(item as PurchaseOrderItem);

      } catch (error) {
        console.error(`Erro ao processar linha ${i + 1}:`, error);
        console.error('Valores da linha:', values);
        continue;
      }
    }

    if (items.length === 0) {
      throw new Error('Nenhum produto válido foi encontrado no arquivo CSV');
    }

    console.log(`Total de produtos processados: ${items.length}`);
    return items;

  } catch (error) {
    console.error('Erro geral no parseProductCSVData:', error);
    throw error;
  }
}
