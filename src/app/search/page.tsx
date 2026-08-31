import { Search, Link as LinkIcon, Calendar, CheckSquare, Dumbbell, Scale, FileText } from "lucide-react";
import { auth } from "@/auth";
import { SearchService } from "@/lib/search/service";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";
import { redirect } from "next/navigation";

function getIconForType(type: string) {
  switch (type) {
    case 'task': return <CheckSquare className="w-4 h-4" />;
    case 'note': return <FileText className="w-4 h-4" />;
    case 'workout': return <Dumbbell className="w-4 h-4" />;
    case 'weight': return <Scale className="w-4 h-4" />;
    case 'calendar': return <Calendar className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
}

function getHrefForType(type: string, id: string) {
  switch (type) {
    case 'task': return `/tasks`;
    case 'note': return `/notes`;
    case 'workout': return `/workout`;
    case 'weight': return `/weight`;
    default: return '#';
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return redirect('/sign-in');

  const query = searchParams.q || "";
  const results = await SearchService.globalSearch(session.user.id, query);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <header className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Search Results</h1>
        <form className="flex items-center gap-3 px-4 py-3 bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] rounded-md" action="/search">
          <Search className="w-5 h-5 text-[hsl(var(--ink-secondary))]" />
          <input 
            type="text" 
            name="q"
            defaultValue={query} 
            placeholder="Search tasks, notes, workouts..." 
            className="bg-transparent border-none outline-none flex-1 text-sm text-[hsl(var(--ink))]"
            autoFocus
          />
          <button type="submit" className="hidden">Search</button>
        </form>
      </header>

      {query ? (
        results.length > 0 ? (
          <div className="space-y-4">
            {results.map((res) => (
              <div key={`${res.type}-${res.id}`} className="bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] rounded-lg p-4">
                <Link href={getHrefForType(res.type, res.id)} className="flex items-start gap-3 group">
                  <div className="p-2 bg-[hsl(var(--surface))] rounded-md border border-[hsl(var(--hairline))] text-[hsl(var(--ink-secondary))] group-hover:text-[hsl(var(--primary))] transition-colors">
                    {getIconForType(res.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold group-hover:underline">{res.title}</h3>
                    {res.subtitle && <p className="text-xs text-[hsl(var(--ink-secondary))] mt-0.5">{res.subtitle}</p>}
                  </div>
                </Link>
                
                {res.related && res.related.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[hsl(var(--hairline))] flex flex-col gap-2">
                    <span className="text-[10px] font-semibold text-[hsl(var(--ink-muted))] uppercase tracking-wider">Related</span>
                    <div className="flex flex-wrap gap-2">
                      {res.related.map((rel: any) => (
                        <Link href={getHrefForType(rel._type, rel.id)} key={`${rel._type}-${rel.id}`} className="inline-flex items-center gap-1.5 px-2 py-1 bg-[hsl(var(--surface))] hover:bg-[hsl(var(--canvas))] border border-[hsl(var(--hairline))] rounded text-[11px] font-medium text-[hsl(var(--ink-secondary))] transition-colors">
                          {getIconForType(rel._type)}
                          {rel.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Search className="w-6 h-6" />}
            title="No results found"
            description={`We couldn't find anything matching "${query}".`}
          />
        )
      ) : (
        <EmptyState
          icon={<Search className="w-6 h-6" />}
          title="Search Saarthi"
          description="Enter a query above to search across your tasks, notes, workouts, and more."
        />
      )}
    </div>
  );
}
