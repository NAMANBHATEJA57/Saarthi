"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RelationshipManager } from '@/components/relationships/RelationshipManager';

export function NoteCaptureForm({ 
  initialTitle = '', 
  initialContent = '', 
  noteId = null,
  onSuccess, 
  onCancel 
}: { 
  initialTitle?: string;
  initialContent?: string;
  noteId?: string | null;
  onSuccess: () => void; 
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const url = noteId ? `/api/notes/${noteId}` : '/api/notes';
      const method = noteId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save note');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 flex flex-col h-full">
      <div className="space-y-2">
        <Label className="sr-only">Title</Label>
        <Input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Note Title" 
          required 
          autoFocus={!noteId} 
          className="text-lg font-bold border-none focus-visible:ring-0 px-0 h-10 bg-transparent"
        />
      </div>

      <div className="flex-1 min-h-[200px]">
        <Label className="sr-only">Content</Label>
        <Textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          placeholder="Start writing..." 
          className="w-full h-full resize-none border-none focus-visible:ring-0 px-0 bg-transparent"
        />
      </div>

      {error && <div className="text-destructive text-sm font-medium">{error}</div>}

      {noteId && (
        <div className="pt-4 border-t border-[hsl(var(--hairline))]">
          <RelationshipManager sourceType="note" sourceId={noteId} />
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t border-[hsl(var(--hairline))]">
        <Button type="button" variant="utility" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
