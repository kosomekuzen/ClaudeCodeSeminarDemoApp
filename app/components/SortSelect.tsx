"use client";

import { SORT_OPTIONS } from "@/app/lib/sort";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function SortSelect({ value, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      並び替え
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
