import 'dotenv/config';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { users, tasks, notes, objectRelationships } from '@/lib/db/schema';
import { RelationshipService } from '../service';
import { eq } from 'drizzle-orm';

describe('RelationshipService', () => {
  let userIdA: string;
  let userIdB: string;
  let taskAId: string;
  let taskBId: string;
  let noteAId: string;

  beforeEach(async () => {
    // Clear relationships
    await db.delete(objectRelationships);
    await db.delete(tasks);
    await db.delete(notes);
    await db.delete(users);

    // Create users
    const [userA] = await db.insert(users).values({ name: 'User A', email: 'a@example.com', updatedAt: new Date() }).returning();
    const [userB] = await db.insert(users).values({ name: 'User B', email: 'b@example.com', updatedAt: new Date() }).returning();
    userIdA = userA.id;
    userIdB = userB.id;

    // Create objects for User A
    const [taskA] = await db.insert(tasks).values({ userId: userIdA, title: 'Task A' }).returning();
    const [noteA] = await db.insert(notes).values({ userId: userIdA, title: 'Note A' }).returning();
    taskAId = taskA.id;
    noteAId = noteA.id;

    // Create objects for User B
    const [taskB] = await db.insert(tasks).values({ userId: userIdB, title: 'Task B' }).returning();
    taskBId = taskB.id;
  });

  it('should link and unlink objects bidirectionally', async () => {
    // Link Task A and Note A
    await RelationshipService.linkObjects(userIdA, {
      sourceType: 'task', sourceId: taskAId, targetType: 'note', targetId: noteAId
    });

    // Lookup from Task A
    const relatedToTask = await RelationshipService.getRelatedObjects(userIdA, 'task', taskAId);
    expect(relatedToTask.length).toBe(1);
    expect(relatedToTask[0].id).toBe(noteAId);
    expect(relatedToTask[0]._type).toBe('note');

    // Lookup from Note A (Bidirectional)
    const relatedToNote = await RelationshipService.getRelatedObjects(userIdA, 'note', noteAId);
    expect(relatedToNote.length).toBe(1);
    expect(relatedToNote[0].id).toBe(taskAId);
    expect(relatedToNote[0]._type).toBe('task');

    // Unlink
    await RelationshipService.unlinkObjects(userIdA, taskAId, noteAId);
    const relatedAfterUnlink = await RelationshipService.getRelatedObjects(userIdA, 'task', taskAId);
    expect(relatedAfterUnlink.length).toBe(0);
  });

  it('should enforce user isolation and not return other users objects', async () => {
    // User A malicious attempt to link to User B's task
    await RelationshipService.linkObjects(userIdA, {
      sourceType: 'task', sourceId: taskAId, targetType: 'task', targetId: taskBId
    });

    // When we fetch from Task A, it should NOT return Task B because Task B belongs to User B
    const related = await RelationshipService.getRelatedObjects(userIdA, 'task', taskAId);
    expect(related.length).toBe(0);
  });

  it('should hide deleted objects (Trash behavior) safely', async () => {
    await RelationshipService.linkObjects(userIdA, {
      sourceType: 'task', sourceId: taskAId, targetType: 'note', targetId: noteAId
    });

    // Soft delete the note
    await db.update(notes).set({ deletedAt: new Date() }).where(eq(notes.id, noteAId));

    // Lookup from Task A (should not see the deleted note)
    const related = await RelationshipService.getRelatedObjects(userIdA, 'task', taskAId);
    expect(related.length).toBe(0);

    // Restore the note
    await db.update(notes).set({ deletedAt: null }).where(eq(notes.id, noteAId));

    // Lookup from Task A (should see the note again)
    const relatedAfterRestore = await RelationshipService.getRelatedObjects(userIdA, 'task', taskAId);
    expect(relatedAfterRestore.length).toBe(1);
    expect(relatedAfterRestore[0].id).toBe(noteAId);
  });
});
