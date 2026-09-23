"use client";

import { useState, useEffect, useCallback } from "react";
import { Link2, X, Plus, Search, Calendar, CheckSquare, Dumbbell, Scale, FileText, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function getIconForType(type: string) {
  switch (type) {
    case 'task': return <CheckSquare className="w-3 h-3" />;
    case 'note': return <FileText className="w-3 h-3" />;
    case 'workout': return <Dumbbell className="w-3 h-3" />;
    case 'weight': return <Scale className="w-3 h-3" />;
    case 'calendar': return <Calendar className="w-3 h-3" />;
    default: return <FileText className="w-3 h-3" />;
  }
}

interface RelationshipManagerProps {
  sourceType: string;
  sourceId: string;
}

export function RelationshipManager({ sourceType, sourceId }: RelationshipManagerProps) {
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRelationships = useCallback(async () => {
    try {
      const res = await fetch(`/api/relationships?sourceType=${sourceType}&sourceId=${sourceId}`);
      if (res.ok) {
        const data = await res.json();
        setRelated(data.related || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [sourceType, sourceId]);

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&excludeType=${sourceType}&excludeId=${sourceId}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, sourceType, sourceId]);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);
  const linkObject = async (targetType: string, targetId: string) => {
    try {
      const res = await fetch(`/api/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType, sourceId, targetType, targetId })
      });
      if (res.ok) {
        await fetchRelationships();
        setIsModalOpen(false);
        setSearchQuery("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const unlinkObject = async (targetId: string) => {
    try {
      const res = await fetch(`/api/relationships?sourceId=${sourceId}&targetId=${targetId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setRelated(prev => prev.filter(r => r.id !== targetId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="animate-pulse h-8 bg-[hsl(var(--surface))] rounded" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-wider text-[hsl(var(--ink-muted))] uppercase flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" />
          Related Connections
        </h3>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <button className="text-[11px] font-medium text-[hsl(var(--primary))] hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" />
              Add Connection
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Link to {sourceType}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-3 px-3 py-2 bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] rounded-md mb-4">
              <Search className="w-4 h-4 text-[hsl(var(--ink-secondary))]" />
              <input 
                type="text"
                placeholder="Search anything in Saarthi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 text-sm"
                autoFocus
              />
            </div>
            
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {isSearching ? (
                <div className="text-sm text-center text-[hsl(var(--ink-muted))] py-4">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(res => {
                  const isAlreadyLinked = related.some(r => r.id === res.id);
                  return (
                    <button
                      key={`${res.type}-${res.id}`}
                      disabled={isAlreadyLinked}
                      onClick={() => linkObject(res.type, res.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                        isAlreadyLinked 
                          ? 'opacity-50 border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] cursor-not-allowed' 
                          : 'border-[hsl(var(--hairline))] bg-[hsl(var(--surface-elevated))] hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--surface))] cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-[hsl(var(--ink-secondary))]">
                          {getIconForType(res.type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{res.title}</p>
                          {res.subtitle && <p className="text-[11px] text-[hsl(var(--ink-secondary))]">{res.subtitle}</p>}
                        </div>
                      </div>
                      {isAlreadyLinked && <span className="text-[10px] text-[hsl(var(--ink-muted))] font-semibold">LINKED</span>}
                    </button>
                  );
                })
              ) : searchQuery ? (
                <div className="text-sm text-center text-[hsl(var(--ink-muted))] py-4">No results found</div>
              ) : (
                <div className="text-sm text-center text-[hsl(var(--ink-muted))] py-4">Type to search across notes, tasks, workouts, etc.</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {related.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {related.map(rel => (
            <div key={rel.id} className="group flex items-center gap-1.5 px-2.5 py-1.5 bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] rounded-md text-xs font-medium text-[hsl(var(--ink-secondary))] transition-colors hover:border-[hsl(var(--ink-tertiary))] hover:text-[hsl(var(--ink))]">
              {getIconForType(rel._type)}
              <span className="max-w-[150px] truncate">{rel.title}</span>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); unlinkObject(rel.id); }}
                className="ml-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity focus:opacity-100"
                title="Remove connection"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-[hsl(var(--ink-muted))]">No active connections. Link related context to quickly navigate to it later.</p>
      )}
    </div>
  );
}
