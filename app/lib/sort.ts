import { Property } from "./types";

export type SortOption = {
  id: string;
  label: string;
  compare?: (a: Property, b: Property) => number;
};

export const SORT_OPTIONS: SortOption[] = [
  { id: "recommended", label: "おすすめ順" },
  {
    id: "rentAsc",
    label: "賃料が安い順",
    compare: (a, b) => a.rentManYen - b.rentManYen,
  },
  {
    id: "rentDesc",
    label: "賃料が高い順",
    compare: (a, b) => b.rentManYen - a.rentManYen,
  },
  {
    id: "walkAsc",
    label: "駅から近い順",
    compare: (a, b) => a.station.walkMinutes - b.station.walkMinutes,
  },
  {
    id: "sizeDesc",
    label: "広さが広い順",
    compare: (a, b) => b.sizeSqm - a.sizeSqm,
  },
];

export const DEFAULT_SORT_ID = SORT_OPTIONS[0].id;

export function sortProperties(properties: Property[], sortId: string): Property[] {
  const option = SORT_OPTIONS.find((o) => o.id === sortId);
  if (!option?.compare) return properties;
  return [...properties].sort(option.compare);
}
