import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/app/components/Header";
import { properties } from "@/app/lib/properties";
import { formatDistance, formatRent, formatSize, formatWalkMinutes } from "@/app/lib/format";

type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return properties.map((property) => ({ id: property.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const property = properties.find((p) => p.id === id);
  return { title: property ? `${property.name} | 東京物件サーチ` : "物件が見つかりません" };
}

const FACILITY_CARDS = [
  { key: "station" as const, icon: "🚉", label: "最寄り駅" },
  { key: "supermarket" as const, icon: "🛒", label: "スーパー" },
  { key: "hospital" as const, icon: "🏥", label: "病院" },
];

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const property = properties.find((p) => p.id === id);

  if (!property) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline"
        >
          ← 物件一覧に戻る
        </Link>

        <div className="grid grid-cols-1 gap-2 overflow-hidden rounded-2xl sm:grid-cols-2">
          {property.images.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              className="aspect-[4/3] w-full object-cover"
            />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-1">
          <span className="w-fit rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
            {property.ward}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">{property.name}</h1>
          <p className="text-sm text-slate-500">{property.address}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-baseline gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-3xl font-extrabold text-teal-700">{formatRent(property.rentManYen)}</p>
          <p className="text-sm text-slate-500">
            管理費 {property.managementFeeYen.toLocaleString("ja-JP")}円
          </p>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-slate-400">間取り</dt>
            <dd className="text-base font-bold text-slate-900">{property.layout}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">広さ</dt>
            <dd className="text-base font-bold text-slate-900">{formatSize(property.sizeSqm)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">築年数</dt>
            <dd className="text-base font-bold text-slate-900">築{property.buildingAgeYears}年</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">所在階</dt>
            <dd className="text-base font-bold text-slate-900">{property.floorInfo}</dd>
          </div>
        </dl>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {FACILITY_CARDS.map(({ key, icon, label }) => {
            const facility = property[key];
            return (
              <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {key === "station"
                    ? `${property.station.line} ${property.station.name}駅`
                    : facility.name}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  {formatWalkMinutes(facility.walkMinutes)}
                  {"distanceMeters" in facility && (
                    <span className="text-slate-400">
                      {" "}
                      / {formatDistance(facility.distanceMeters)}
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
