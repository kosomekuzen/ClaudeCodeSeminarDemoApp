import { Property } from "@/app/lib/types";
import PropertyCard from "./PropertyCard";

type Props = {
  properties: Property[];
};

export default function PropertyGrid({ properties }: Props) {
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
        <p className="text-4xl">🔍</p>
        <p className="mt-3 text-sm font-medium text-slate-600">
          条件に一致する物件が見つかりませんでした
        </p>
        <p className="mt-1 text-xs text-slate-400">こだわり条件を緩めてもう一度お試しください</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
