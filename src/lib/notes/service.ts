import { db } from '../db';
import { notes } from '../db/schema';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';

export async function getNotes(userId: string) {
  return await db.select()
    .from(notes)
    .where(and(
      eq(notes.userId, userId),
      isNull(notes.deletedAt)
    ))
    .orderBy(desc(notes.updatedAt));
}

export async function getNoteById(userId: string, noteId: string) {
  const [note] = await db.select()
    .from(notes)
    .where(and(
      eq(notes.id, noteId),
      eq(notes.userId, userId),
      isNull(notes.deletedAt)
    ));
  return note;
}

export async function createNote(userId: string, data: { title: string; content?: string }) {
  const title = data.title.trim();
  const [note] = await db.insert(notes).values({
    userId,
    title: title,
    content: data.content || '',
  }).returning();
  return note;
}

export async function updateNote(userId: string, noteId: string, data: { title?: string; content?: string; deletedAt?: Date }) {
  const updateData: any = { updatedAt: new Date() };
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.content !== undefined) updateData.content = data.content;
  if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt;

  const [updated] = await db.update(notes)
    .set(updateData)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .returning();
  return updated;
}
