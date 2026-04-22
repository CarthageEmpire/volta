import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import { normalizeText } from '../services/normalizeText';

interface LocationSelectProps {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  searchPlaceholder: string;
  emptyStateLabel: string;
  excludedValue?: string;
  invalid?: boolean;
  error?: string;
  onChange: (value: string) => void;
}

export default function LocationSelect({
  label,
  placeholder,
  value,
  options,
  searchPlaceholder,
  emptyStateLabel,
  excludedValue,
  invalid = false,
  error,
  onChange,
}: LocationSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeText(deferredQuery);

    return options.filter((option) => {
      if (excludedValue && option === excludedValue) {
        return false;
      }

      return normalizedQuery.length === 0 || normalizeText(option).includes(normalizedQuery);
    });
  }, [deferredQuery, excludedValue, options]);

  const selectClassName = `w-full rounded-[1.4rem] border px-4 py-4 text-left outline-none transition ${
    invalid
      ? 'border-red-200 bg-red-50 text-red-900'
      : 'border-slate-200 bg-slate-100 text-slate-900 focus:border-slate-300'
  }`;

  const chooseValue = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
      <span>{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${selectClassName} md:hidden`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option} disabled={option === excludedValue}>
            {option}
          </option>
        ))}
      </select>

      <div ref={rootRef} className="relative hidden md:block">
        <button
          type="button"
          className={`${selectClassName} flex items-center justify-between gap-3`}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className={value ? 'text-slate-900' : 'text-slate-400'}>{value || placeholder}</span>
          <span className="material-symbols-outlined text-slate-400">expand_more</span>
        </button>

        {isOpen && (
          <div
            id={panelId}
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.14)]"
          >
            <div className="border-b border-slate-100 p-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 outline-none"
                type="search"
                autoFocus
              />
            </div>

            <div className="max-h-64 overflow-y-auto p-2">
              <button
                type="button"
                onClick={() => chooseValue('')}
                className="flex w-full items-center rounded-[1rem] px-3 py-3 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-50"
              >
                {placeholder}
              </button>

              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => chooseValue(option)}
                    className={`flex w-full items-center rounded-[1rem] px-3 py-3 text-left text-sm font-medium transition ${
                      option === value
                        ? 'bg-[rgba(0,64,161,0.08)] text-slate-950'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {option}
                  </button>
                ))
              ) : (
                <p className="px-3 py-4 text-sm font-medium text-slate-400">{emptyStateLabel}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
    </label>
  );
}
