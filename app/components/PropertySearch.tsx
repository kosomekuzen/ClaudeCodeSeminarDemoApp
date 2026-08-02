"use client";

import { useMemo, useState } from "react";
import { Property } from "@/app/lib/types";
import { FilterValues, defaultFilterValues, filterProperties } from "@/app/lib/filters";
import { DEFAULT_SORT_ID, sortProperties } from "@/app/lib/sort";
import FilterPanel from "./FilterPanel";
import SortSelect from "./SortSelect";
import PropertyGrid from "./PropertyGrid";

type Props = {
  properties: Property[];
};

export default function PropertySearch({ properties }: Props) {
  const [filterValues, setFilterValues] = useState<FilterValues>(() => defaultFilterValues());
  const [sortId, setSortId] = useState(DEFAULT_SORT_ID);

  const visibleProperties = useMemo(() => {
    const filtered = filterProperties(properties, filterValues);
    return sortProperties(filtered, sortId);
  }, [properties, filterValues, sortId]);

  function handleFilterChange(id: string, value: string) {
    setFilterValues((prev) => ({ ...prev, [id]: value }));
  }

  function handleReset() {
    setFilterValues(defaultFilterValues());
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <FilterPanel
          values={filterValues}
          onChange={handleFilterChange}
          onReset={handleReset}
          resultCount={visibleProperties.length}
        />
      </aside>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            <span className="text-base font-bold text-slate-900">
              {visibleProperties.length}
            </span>{" "}
            件の物件
          </p>
          <SortSelect value={sortId} onChange={setSortId} />
        </div>
        <PropertyGrid properties={visibleProperties} />
      </div>
    </div>
  );
}
