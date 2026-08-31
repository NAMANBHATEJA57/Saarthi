"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NoteCaptureForm } from '@/components/notes/NoteCaptureForm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';
import { Search, Plus, Trash, StickyNote } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export function NotesClient({ initialNotes }: { initialNotes: any[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [search, setSearch] = useState('');
  
  // Editor State
  const [editingNote, setEditingNote] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Delete State
  const [noteToDelete, setNoteToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredNotes = notes.filter((n) => {
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  const handleSuccess = () => {
    setEditingNote(null);
    setIsCreating(false);
    router.refresh(); // rely on server refresh for simplicity
    // Optimistically fetch notes in future, or just reload page data:
    setTimeout(() => window.location.reload(), 100);
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/notes/${noteToDelete.id}`, { method: 'DELETE' });
      setNotes((prev) => prev.filter((n) => n.id !== noteToDelete.id));
      setNoteToDelete(null);
      setEditingNote(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
      router.refresh();
    }
  };

  if (isCreating) {
    return (
      <div className="bg-[hsl(var(--surface))] p-4 rounded-xl border border-[hsl(var(--hairline))] h-[60vh]">
        <NoteCaptureForm onSuccess={handleSuccess} onCancel={() => setIsCreating(false)} />
      </div>
    );
  }

  if (editingNote) {
    return (
      <div className="space-y-4">
        <div className="bg-[hsl(var(--surface))] p-4 rounded-xl border border-[hsl(var(--hairline))] h-[60vh] flex flex-col relative">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-[hsl(var(--ink-secondary))]">
              Updated {formatRelativeTime(new Date(editingNote.updatedAt))}
            </span>
            <Button variant="icon" onClick={() => setNoteToDelete(editingNote)}>
              <Trash className="w-4 h-4 text-red-500" />
            </Button>
          </div>
          <NoteCaptureForm 
            noteId={editingNote.id}
            initialTitle={editingNote.title}
            initialContent={editingNote.content}
            onSuccess={handleSuccess} 
            onCancel={() => setEditingNote(null)} 
          />
        </div>

        {/* Delete Confirmation Modal */}
        <Dialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Note</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to delete this note? It will be moved to Trash for 7 days.</p>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="utility" onClick={() => setNoteToDelete(null)} disabled={isDeleting}>Cancel</Button>
              <Button variant="utility" className="text-red-500" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--ink-secondary))]" />
          <Input 
            placeholder="Search notes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] focus-visible:ring-[hsl(var(--primary))] h-12 shadow-sm rounded-xl transition-shadow"
          />
        </div>
      )}

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-[hsl(var(--surface))] rounded-2xl border border-dashed border-[hsl(var(--hairline))]">
          <div className="w-12 h-12 rounded-full bg-[hsl(var(--surface-elevated))] flex items-center justify-center mb-4 text-[hsl(var(--ink-secondary))]">
            <StickyNote className="w-6 h-6 opacity-80" />
          </div>
          <h3 className="text-lg font-medium text-[hsl(var(--ink))] mb-1">No Notes</h3>
          <p className="text-sm text-[hsl(var(--ink-secondary))] mb-6">Capture your thoughts and ideas quickly.</p>
          <Button variant="primary" onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.length === 0 && search && (
            <p className="text-[hsl(var(--ink-secondary))] text-center py-4">No notes match your search.</p>
          )}
          {filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => setEditingNote(note)}
              className="w-full text-left p-4 rounded-xl bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] hover:bg-[hsl(var(--surface-elevated))] hover:border-[hsl(var(--primary))/50] transition-all duration-200 active:scale-[0.99] block group shadow-sm"
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-[16px] text-[hsl(var(--ink))] group-hover:text-[hsl(var(--primary))] transition-colors">{note.title}</h3>
                <span className="text-[12px] text-[hsl(var(--ink-secondary))] whitespace-nowrap ml-4 font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                  {formatRelativeTime(new Date(note.updatedAt))}
                </span>
              </div>
              <p className="text-[14px] text-[hsl(var(--ink-secondary))] line-clamp-2 leading-relaxed opacity-90">
                {note.content || "Empty note"}
              </p>
            </button>
          ))}
        </div>
      )}

      {notes.length > 0 && (
        <Button 
          variant="primary" 
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center p-0"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}
