import React from 'react';

interface NumberInputProps {
  field: string;
  value: string;
  onChange: (field: string, value: string) => void;
  placeholder: string;
  step?: number;
  required?: boolean;
  label: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  min?: number;
  max?: number;
  forcePositive?: boolean;
  prefix?: string;
  readOnly?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  field,
  value,
  onChange,
  placeholder,
  step = 0.00001,
  required = false,
  label,
  icon: Icon,
  min,
  max,
  forcePositive = false,
  prefix = '',
  readOnly = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Enhanced input validation to prevent invalid states
    if (inputValue === '' || /^-?\d*\.?\d*$/.test(inputValue)) {
      // Force positive if required
      if (forcePositive && inputValue.startsWith('-')) {
        inputValue = inputValue.slice(1);
      }
      
      // Prevent multiple decimal points
      const decimalCount = (inputValue.match(/\./g) || []).length;
      if (decimalCount > 1) {
        return; // Don't update if multiple decimal points
      }
      
      // Prevent extremely long decimal places (max 8 digits after decimal)
      const parts = inputValue.split('.');
      if (parts[1] && parts[1].length > 8) {
        inputValue = parts[0] + '.' + parts[1].substring(0, 8);
      }
      
      onChange(field, inputValue);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
          <Icon size={16} className="text-gray-400" />
          <span>{label}</span>
        </label>
      )}
      <div className="relative">
        {prefix && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            {prefix}
          </div>
        )}
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          value={value}
          onChange={handleChange}
          className={`w-full border border-gray-600/50 rounded-lg py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
            prefix ? 'pl-8 pr-3' : 'px-3'
          } ${
            readOnly 
              ? 'bg-gray-700/50 cursor-not-allowed text-gray-400' 
              : 'bg-gray-800/50'
          }`}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          min={min}
          max={max}
          step={step}
          readOnly={readOnly}
          disabled={readOnly}
        />
      </div>
    </div>
  );
};