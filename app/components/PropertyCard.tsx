import Link from "next/link";
import { Property } from "@/app/lib/types";
import { formatRent, formatSize, formatWalkMinutes } from "@/app/lib/format";

type Props = {
  property: Property;
};

export default function PropertyCard({ property }: Props) {
  const mainImage = property.images[0];

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* 物件画像 — 一覧で最初に目に入る必須要素 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mainImage.src}
          alt={mainImage.alt}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-800 shadow">
          {property.layout}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-bold leading-snug text-slate-900">{property.name}</h3>
          <p className="whitespace-nowrap text-lg font-extrabold text-teal-700">
            {formatRent(property.rentManYen)}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <dt className="text-slate-400">間取り</dt>
            <dd className="font-medium text-slate-800">{property.layout}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="text-slate-400">広さ</dt>
            <dd className="font-medium text-slate-800">{formatSize(property.sizeSqm)}</dd>
          </div>
        </dl>

        <p className="flex items-center gap-1 text-sm text-slate-700">
          <span aria-hidden="true">🚉</span>
          {property.station.line} 「{property.station.name}」駅{" "}
          {formatWalkMinutes(property.station.walkMinutes)}
        </p>

        <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-1">{property.ward}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1">
            🛒 スーパーまで{formatWalkMinutes(property.supermarket.walkMinutes)}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1">
            🏥 病院まで{formatWalkMinutes(property.hospital.walkMinutes)}
          </span>
        </div>
      </div>
    </Link>
  );
}
