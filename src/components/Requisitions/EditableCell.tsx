import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { DateInput } from '../UI/DateInput';

interface EditableCellProps {
  value: string | number | boolean;
  onSave: (value: any) => void;
  type?: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  options?: string[];
  className?: string;
  displayValue?: React.ReactNode;
}

export function EditableCell({ 
  value, 
  onSave, 
  type = 'text', 
  options = [], 
  className = '',
  displayValue 
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' && inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatDisplayValue = () => {
    if (displayValue) return displayValue;
    if (type === 'checkbox') return value ? 'Sim' : 'Não';
    if (type === 'number' && typeof value === 'number') {
      return value.toLocaleString('pt-BR');
    }
    if (type === 'date' && value) {
      return formatDate(value as string);
    }
    return value?.toString() || '-';
  };

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className={`cursor-pointer hover:bg-blue-50/50 px-2 py-1.5 rounded-lg min-h-[32px] flex items-center transition-all duration-200 ${className}`}
        title="Clique para editar"
      >
        {formatDisplayValue()}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {type === 'select' ? (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue as string}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="text-sm border border-blue-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px] bg-white shadow-sm"
        >
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : type === 'checkbox' ? (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="checkbox"
          checked={editValue as boolean}
          onChange={(e) => {
            setEditValue(e.target.checked);
            onSave(e.target.checked);
            setIsEditing(false);
          }}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
        />
      ) : type === 'date' ? (
        <DateInput
          value={editValue as string}
          onChange={(value) => setEditValue(value)}
          className="text-sm border border-blue-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px] bg-white shadow-sm"
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          value={editValue as string}
          onChange={(e) => setEditValue(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="text-sm border border-blue-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px] bg-white shadow-sm"
        />
      )}
      <button
        onClick={handleSave}
        className="text-green-600 hover:text-green-700 p-1 hover:bg-green-50 rounded-lg transition-all duration-200"
        title="Salvar"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        onClick={handleCancel}
        className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-all duration-200"
        title="Cancelar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}