import Header from "@/app/components/Header";
import PropertySearch from "@/app/components/PropertySearch";
import { properties } from "@/app/lib/properties";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <PropertySearch properties={properties} />
      </main>
    </div>
  );
}
