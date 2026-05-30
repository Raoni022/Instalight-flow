import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  options?: string[];
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
  const cls = `w-full text-xs rounded border px-2 py-1.5 outline-none focus:ring-1 focus:ring-orange-400 ${
    isAI ? 'border-orange-400 bg-orange-50' : 'border-slate-300'
  }`;

  return (
    <div>
      <label className="block text-xs text-slate-500 mb-0.5">
        {label}
        {isAI && <span className="ml-1 text-orange-400">✨</span>}
      </label>
      {options ? (
        <select name={name} value={value} onChange={onChange} className={cls}>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
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
