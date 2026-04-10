import React, { useState, useEffect, useRef } from 'react';
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
  const isUserTyping = useRef(false);

  useEffect(() => {
    if (!isUserTyping.current) {
      if (value) {
        setDisplayValue(convertISOToBrazilian(value));
      } else {
        setDisplayValue('');
      }
    }
  }, [value]);

  const applyMask = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').substring(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.substring(0, 2)}/${digits.substring(2)}`;
    return `${digits.substring(0, 2)}/${digits.substring(2, 4)}/${digits.substring(4)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isUserTyping.current = true;
    const masked = applyMask(e.target.value);
    setDisplayValue(masked);

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(masked)) {
      const iso = convertBrazilianToISO(masked);
      onChange(iso || '');
    } else if (masked === '') {
      onChange('');
    }
  };

  const handleBlur = () => {
    isUserTyping.current = false;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(displayValue)) {
      const iso = convertBrazilianToISO(displayValue);
      if (iso) {
        onChange(iso);
        setDisplayValue(convertISOToBrazilian(iso));
      } else {
        setDisplayValue('');
        onChange('');
      }
    } else if (displayValue !== '') {
      setDisplayValue('');
      onChange('');
    }
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      required={required}
      disabled={disabled}
      id={id}
      name={name}
      maxLength={10}
    />
  );
}
