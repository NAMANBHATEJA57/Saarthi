import { Search } from "lucide-react";

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q || "";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <header className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Search Results</h1>
        <div className="flex items-center gap-3 px-4 py-3 bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] rounded-md">
          <Search className="w-5 h-5 text-[hsl(var(--ink-secondary))]" />
          <input 
            type="text" 
            defaultValue={query} 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none flex-1 text-sm text-[hsl(var(--ink))]"
            readOnly
          />
        </div>
      </header>

      <section className="bg-[hsl(var(--canvas))] border border-[hsl(var(--hairline))] border-dashed rounded-lg p-12 text-center">
        <p className="text-sm text-[hsl(var(--ink-secondary))]">
          {query ? `No results found for "${query}"` : "Enter a query to search."}
        </p>
        <p className="text-xs text-[hsl(var(--ink-muted))] mt-2">
          (Search index is currently empty in Phase 1)
        </p>
      </section>
    </div>
  );
}
