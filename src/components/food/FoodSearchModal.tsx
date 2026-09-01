"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Plus } from "lucide-react";
import { BackButton } from '@/components/shared/BackButton';

interface FoodSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType: string;
  localDate: string;
  onSuccess: () => void;
}

export function FoodSearchModal({ open, onOpenChange, mealType, localDate, onSuccess }: FoodSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [recordDetails, setRecordDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [selectedPortion, setSelectedPortion] = useState<any>(null);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelectedRecordId(null);
      setRecordDetails(null);
      setQuantity(1);
      setSelectedPortion(null);
    }
  }, [open]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 2) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (q: string) => {
    setSearching(true);
    try {
      const res = await fetch(`/api/food/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = async (result: any) => {
    setLoadingDetails(true);
    setSelectedRecordId("loading"); // temp state
    try {
      // 1. Resolve and persist
      const resolveRes = await fetch('/api/food/external/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: result.sourceId, externalId: result.externalId })
      });
      const resolveData = await resolveRes.json();
      
      if (resolveData.error) throw new Error(resolveData.error);
      
      const recordId = resolveData.recordId;
      setSelectedRecordId(recordId);

      // 2. Fetch full details
      const detailRes = await fetch(`/api/food/record/${recordId}`);
      const detailData = await detailRes.json();
      
      setRecordDetails(detailData);
      
      if (detailData.portions && detailData.portions.length > 0) {
        setSelectedPortion(detailData.portions[0]);
      } else {
        setSelectedPortion({ label: '100g', grams: 100 });
      }

    } catch (e) {
      console.error(e);
      setSelectedRecordId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleLogFood = async () => {
    if (!selectedRecordId || !recordDetails) return;
    
    setLogging(true);
    try {
      const res = await fetch('/api/food/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localDate,
          mealType,
          sourceRecordId: selectedRecordId,
          quantity,
          selectedPortion,
          displaySnapshot: { name: recordDetails.record.normalizedIdentity }
        })
      });
      
      if (!res.ok) throw new Error("Failed to log food");
      
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLogging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[hsl(var(--canvas))] p-0 gap-0 overflow-hidden h-[85vh] sm:h-[600px] flex flex-col">
        {!selectedRecordId ? (
          <>
            <div className="p-4 border-b border-[hsl(var(--hairline))] bg-[hsl(var(--surface))] shrink-0">
              <DialogTitle className="text-lg font-semibold mb-3">Add to {mealType}</DialogTitle>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[hsl(var(--ink-secondary))]" />
                <Input
                  placeholder="Search foods..."
                  className="pl-9 h-10 bg-[hsl(var(--canvas))]"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 bg-[hsl(var(--canvas))]">
              {searching ? (
                <div className="flex justify-center p-8 text-[hsl(var(--ink-secondary))]">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectResult(r)}
                      className="w-full text-left p-3 hover:bg-[hsl(var(--surface-elevated))] rounded-lg flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <p className="font-medium text-[15px]">{r.identity}</p>
                        <p className="text-[12px] text-[hsl(var(--ink-secondary))] mt-0.5 capitalize">
                          {r.sourceId.replace('_', ' ')}
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-[hsl(var(--primary))] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              ) : query.length > 2 ? (
                <div className="text-center p-8 text-sm text-[hsl(var(--ink-secondary))]">
                  No foods found matching "{query}"
                </div>
              ) : (
                <div className="text-center p-8 text-sm text-[hsl(var(--ink-secondary))]">
                  Type at least 3 characters to search OpenFoodFacts and more.
                </div>
              )}
            </div>
          </>
        ) : loadingDetails ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))] mb-4" />
            <p className="text-sm font-medium text-[hsl(var(--ink-secondary))]">Loading nutritional info...</p>
          </div>
        ) : recordDetails && (
          <div className="flex flex-col h-full">
            <div className="flex items-center p-4 border-b border-[hsl(var(--hairline))] shrink-0">
              <BackButton onClick={() => setSelectedRecordId(null)} className="mr-3" />
              <DialogTitle className="text-lg font-semibold truncate pr-4">
                {recordDetails.record.normalizedIdentity}
              </DialogTitle>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider">PORTION</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] px-3 py-2 text-sm focus:outline-none focus:border-[hsl(var(--primary))]"
                    value={JSON.stringify(selectedPortion)}
                    onChange={(e) => setSelectedPortion(JSON.parse(e.target.value))}
                  >
                    {recordDetails.portions && recordDetails.portions.length > 0 ? (
                      recordDetails.portions.map((p: any, i: number) => (
                        <option key={i} value={JSON.stringify(p)}>
                          {p.label} {p.grams ? `(${p.grams}g)` : ''}
                        </option>
                      ))
                    ) : (
                      <option value={JSON.stringify({ label: '100g', grams: 100 })}>100g</option>
                    )}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider">QUANTITY</label>
                  <Input 
                    type="number" 
                    min="0.1" 
                    step="0.1"
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="h-10 bg-[hsl(var(--canvas))]"
                  />
                </div>
              </div>

              <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] rounded-lg p-4">
                <h4 className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider mb-3">NUTRITION SUMMARY</h4>
                <div className="space-y-2">
                  {recordDetails.nutrients.slice(0, 5).map((n: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="capitalize">{n.nutrientKey.replace('_', ' ')}</span>
                      <span className="font-medium">
                        {(Number(n.amount) * (selectedPortion?.grams || 100) / 100 * quantity).toFixed(1)}{n.unit}
                      </span>
                    </div>
                  ))}
                  {recordDetails.nutrients.length === 0 && (
                    <p className="text-sm text-[hsl(var(--ink-secondary))]">Detailed nutrition not available for this item.</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-[hsl(var(--hairline))] bg-[hsl(var(--surface))] shrink-0">
              <Button 
                variant="primary" 
                className="w-full" 
                onClick={handleLogFood}
                disabled={logging}
              >
                {logging ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Log to {mealType}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
