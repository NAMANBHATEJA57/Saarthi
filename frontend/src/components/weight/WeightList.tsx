"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2, Edit2, X, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface WeightEntry {
  id: string;
  weight: string;
  unit: string;
  note: string | null;
  recordedAt: Date;
}

export function WeightList({ initialEntries }: { initialEntries: WeightEntry[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editNote, setEditNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleEditStart = (entry: WeightEntry) => {
    setEditingId(entry.id);
    setEditWeight(entry.weight);
    setEditNote(entry.note || "");
    setOpenMenuId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const handleEditSave = async (id: string) => {
    if (!editWeight || isNaN(parseFloat(editWeight))) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/weight-entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight: editWeight, note: editNote }),
      });
      if (res.ok) {
        setEditingId(null);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this weight entry?")) return;
    try {
      const res = await fetch(`/api/weight-entries/${id}`, { method: "DELETE" });
      if (res.ok) {
        setOpenMenuId(null);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Very simple date formatter
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-3">
      {initialEntries.map((entry) => {
        const isEditing = editingId === entry.id;

        return (
          <div key={entry.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] relative">
            {isEditing ? (
              <div className="flex-1 grid gap-4 w-full sm:w-auto">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      step="0.1"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      className="w-full text-lg font-semibold bg-transparent border-b border-[hsl(var(--hairline))] focus:border-[hsl(var(--primary))] outline-none py-1"
                      autoFocus
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="Note"
                      className="w-full text-sm bg-transparent border-b border-[hsl(var(--hairline))] focus:border-[hsl(var(--primary))] outline-none py-1.5"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end sm:justify-start">
                  <button onClick={handleEditCancel} className="p-2 text-[hsl(var(--ink-secondary))] hover:bg-[hsl(var(--surface-elevated))] rounded-md transition-colors" disabled={isSubmitting}>
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEditSave(entry.id)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-md transition-colors" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xl font-semibold">{entry.weight} <span className="text-sm font-normal text-[hsl(var(--ink-secondary))]">{entry.unit}</span></span>
                    <span className="text-xs text-[hsl(var(--ink-muted))]">{formatDate(entry.recordedAt)}</span>
                  </div>
                  {entry.note && (
                    <p className="text-sm text-[hsl(var(--ink-secondary))]">{entry.note}</p>
                  )}
                </div>
                
                <div className="mt-2 sm:mt-0 flex sm:opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                  {openMenuId === entry.id ? (
                    <div className="flex items-center gap-1 bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] rounded-md p-1 shadow-sm">
                      <button onClick={() => handleEditStart(entry)} className="p-1.5 hover:bg-[hsl(var(--surface))] rounded-sm text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))] transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-[hsl(var(--hairline))]" />
                      <button onClick={() => handleDelete(entry.id)} className="p-1.5 hover:bg-red-500/10 rounded-sm text-red-500 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-[hsl(var(--hairline))]" />
                      <button onClick={() => setOpenMenuId(null)} className="p-1.5 hover:bg-[hsl(var(--surface))] rounded-sm text-[hsl(var(--ink-secondary))] transition-colors" title="Close">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setOpenMenuId(entry.id)} 
                      className="p-2 text-[hsl(var(--ink-secondary))] hover:bg-[hsl(var(--surface-elevated))] rounded-md transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
