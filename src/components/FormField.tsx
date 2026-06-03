import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  options?: (string | SelectOption)[];
  readonly?: boolean;
  aiFields?: Set<string>;
  placeholder?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  options,
  readonly,
  aiFields,
  placeholder,
}) => {
  const isAI = aiFields?.has(name) ?? false;
  const cls = `w-full text-xs rounded border px-2 py-1.5 outline-none focus:ring-1 focus:ring-brand-400 ${
    isAI ? 'border-brand-400 bg-brand-50' : 'border-slate-300'
  }`;

  return (
    <div>
      <label className="block text-xs text-slate-500 mb-0.5">
        {label}
        {isAI && <span className="ml-1 text-brand-400">✨</span>}
      </label>
      {options ? (
        <select name={name} value={value} onChange={onChange} className={cls}>
          {options.map((o) => {
            const val = typeof o === 'string' ? o : o.value;
            const lbl = typeof o === 'string' ? o : o.label;
            return <option key={val} value={val}>{lbl}</option>;
          })}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readonly}
          placeholder={placeholder}
          className={cls + (readonly ? ' bg-slate-50 text-slate-400' : '')}
        />
      )}
    </div>
  );
};
