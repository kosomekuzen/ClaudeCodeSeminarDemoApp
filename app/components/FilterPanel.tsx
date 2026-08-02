"use client";

import { FILTER_DEFINITIONS, FilterValues, isFilterActive } from "@/app/lib/filters";

const FILTER_ICONS: Record<string, string> = {
  stationWalk: "🚶",
  supermarketWalk: "🛒",
  hospitalWalk: "🏥",
};

type Props = {
  values: FilterValues;
  onChange: (id: string, value: string) => void;
  onReset: () => void;
  resultCount: number;
};

export default function FilterPanel({ values, onChange, onReset, resultCount }: Props) {
  const activeCount = FILTER_DEFINITIONS.filter((def) =>
    isFilterActive(def, values[def.id] ?? def.defaultValue)
  ).length;
  const isDefault = activeCount === 0;

  return (
    <section
      aria-labelledby="filter-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="filter-heading" className="text-base font-bold text-slate-900">
          こだわり条件で探す
        </h2>
        {!isDefault && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-teal-700 underline decoration-teal-300 underline-offset-2 hover:text-teal-900"
          >
            条件をリセット
          </button>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {FILTER_DEFINITIONS.map((def) => {
          const currentValue = values[def.id] ?? def.defaultValue;
          const active = isFilterActive(def, currentValue);
          return (
            <div key={def.id} className="flex flex-col gap-1.5">
              <label
                htmlFor={`filter-${def.id}`}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-800"
              >
                <span aria-hidden="true">{FILTER_ICONS[def.id] ?? "📍"}</span>
                {def.label}
                {active && (
                  <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                    設定中
                  </span>
                )}
              </label>
              {def.helperText && (
                <p className="text-xs leading-snug text-slate-500">{def.helperText}</p>
              )}
              <select
                id={`filter-${def.id}`}
                value={currentValue}
                onChange={(e) => onChange(def.id, e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              >
                {def.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
        <span className="text-lg font-bold text-teal-700">{resultCount}</span> 件の物件が見つかりました
      </p>
      <p className="mt-2 text-[11px] leading-snug text-slate-400">
        ※ こだわり条件は今後も追加予定です
      </p>
    </section>
  );
}
