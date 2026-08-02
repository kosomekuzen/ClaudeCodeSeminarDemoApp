import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-base font-bold text-white">
            東
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            東京物件サーチ
          </span>
        </Link>
        <p className="text-sm text-slate-500">
          東京エリアの賃貸物件を、こだわり条件でかんたんに絞り込めます。
        </p>
      </div>
    </header>
  );
}
