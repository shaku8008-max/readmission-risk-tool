'use client';

/** Shared form input components used by both v1 and v2 calculators. */

interface NumericInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  feature: string;
  typical: string;
  featureRanges: Record<string, { min: number; max: number }>;
}

export function NumericInput({ label, value, onChange, feature, typical, featureRanges }: NumericInputProps) {
  const r = featureRanges[feature];
  const id = `i-${feature}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        step="1"
        min={r?.min}
        max={r?.max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      {typical && <p className="mt-1 text-xs text-slate-500">{typical}</p>}
    </div>
  );
}

const btnCls = (active: boolean) =>
  `px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-600 text-white border-blue-600'
      : 'bg-white text-slate-700 border-slate-300 hover:border-blue-300'
  }`;

interface YesNoButtonsProps {
  value: string;
  onChange: (v: string) => void;
  typical?: string;
}

export function YesNoButtons({ value, onChange, typical }: YesNoButtonsProps) {
  return (
    <div>
      <div className="flex gap-4">
        <button type="button" className={btnCls(value === '1')} onClick={() => onChange('1')}>Yes</button>
        <button type="button" className={btnCls(value === '0')} onClick={() => onChange('0')}>No</button>
      </div>
      {typical && <p className="mt-1 text-xs text-slate-500">{typical}</p>}
    </div>
  );
}

const selCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

interface SelectInputProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: number | string; label: string }[];
  placeholder?: string;
  typical?: string;
}

export function SelectInput({ id, value, onChange, options, placeholder, typical }: SelectInputProps) {
  return (
    <div>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selCls}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {typical && <p className="mt-1 text-xs text-slate-500">{typical}</p>}
    </div>
  );
}

export { selCls };
