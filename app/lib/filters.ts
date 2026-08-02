import { Property } from "./types";

export type FilterOption = {
  value: string;
  label: string;
};

/**
 * A single "こだわり条件". New filters can be added later by appending an
 * entry here — the filter panel UI and the filtering logic both pick up
 * new definitions automatically without further changes.
 */
export type FilterDefinition = {
  id: string;
  label: string;
  helperText?: string;
  options: FilterOption[];
  defaultValue: string;
  match: (property: Property, value: string) => boolean;
};

export const ANY_VALUE = "any";

export const FILTER_DEFINITIONS: FilterDefinition[] = [
  {
    id: "stationWalk",
    label: "駅からの徒歩時間",
    options: [
      { value: ANY_VALUE, label: "こだわらない" },
      { value: "5", label: "徒歩5分以内" },
      { value: "7", label: "徒歩7分以内" },
      { value: "10", label: "徒歩10分以内" },
      { value: "15", label: "徒歩15分以内" },
    ],
    defaultValue: ANY_VALUE,
    match: (property, value) =>
      value === ANY_VALUE || property.station.walkMinutes <= Number(value),
  },
  {
    id: "supermarketWalk",
    label: "スーパーの近さ",
    helperText: "最寄りスーパーまでの徒歩時間で絞り込みます",
    options: [
      { value: ANY_VALUE, label: "こだわらない" },
      { value: "5", label: "徒歩5分以内" },
      { value: "10", label: "徒歩10分以内" },
    ],
    defaultValue: ANY_VALUE,
    match: (property, value) =>
      value === ANY_VALUE || property.supermarket.walkMinutes <= Number(value),
  },
  {
    id: "hospitalWalk",
    label: "病院からの離れ具合",
    helperText: "静かな環境を重視する方向けに、病院までの距離で絞り込みます",
    options: [
      { value: ANY_VALUE, label: "こだわらない" },
      { value: "15", label: "徒歩15分以上離れている" },
      { value: "20", label: "徒歩20分以上離れている" },
    ],
    defaultValue: ANY_VALUE,
    match: (property, value) =>
      value === ANY_VALUE || property.hospital.walkMinutes >= Number(value),
  },
];

export type FilterValues = Record<string, string>;

export function defaultFilterValues(): FilterValues {
  return Object.fromEntries(
    FILTER_DEFINITIONS.map((def) => [def.id, def.defaultValue])
  );
}

export function filterProperties(
  properties: Property[],
  values: FilterValues
): Property[] {
  return properties.filter((property) =>
    FILTER_DEFINITIONS.every((def) =>
      def.match(property, values[def.id] ?? def.defaultValue)
    )
  );
}

export function isFilterActive(def: FilterDefinition, value: string): boolean {
  return value !== def.defaultValue;
}
