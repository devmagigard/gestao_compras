import React, { useState, useEffect } from 'react';
import { convertISOToBrazilian, convertBrazilianToISO } from '../../utils/dateHelpers';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
}

export function DateInput({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  className = '',
  required = false,
  disabled = false,
  id,
  name
}: DateInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  // Converter valor ISO para formato brasileiro para exibição
  useEffect(() => {
    if (value) {
      const brazilianDate = convertISOToBrazilian(value);
      setDisplayValue(brazilianDate);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Permitir apenas números e barras
    const cleanValue = inputValue.replace(/[^\d\/]/g, '');
    
    // Aplicar máscara dd/mm/yyyy
    let maskedValue = cleanValue;
    if (cleanValue.length >= 2 && !cleanValue.includes('/')) {
      maskedValue = cleanValue.substring(0, 2) + '/' + cleanValue.substring(2);
    }
    if (cleanValue.length >= 5 && cleanValue.split('/').length === 2) {
      const parts = cleanValue.split('/');
      maskedValue = parts[0] + '/' + parts[1].substring(0, 2) + '/' + parts[1].substring(2);
    }
    if (maskedValue.length > 10) {
      maskedValue = maskedValue.substring(0, 10);
    }
    
    setDisplayValue(maskedValue);
    
    // Se a data está completa (dd/mm/yyyy), converter para ISO e enviar
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(maskedValue)) {
      const isoDate = convertBrazilianToISO(maskedValue);
      if (isoDate) {
        onChange(isoDate);
      }
    } else if (maskedValue === '') {
      onChange('');
    }
  };

  const handleBlur = () => {
    // Validar e corrigir a data ao sair do campo
    if (displayValue && /^\d{2}\/\d{2}\/\d{4}$/.test(displayValue)) {
      const isoDate = convertBrazilianToISO(displayValue);
      if (isoDate) {
        onChange(isoDate);
        setDisplayValue(convertISOToBrazilian(isoDate));
      } else {
        // Data inválida, limpar
        setDisplayValue('');
        onChange('');
      }
    }
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={`${className}`}
      required={required}
      disabled={disabled}
      id={id}
      name={name}
      maxLength={10}
    />
  );
}