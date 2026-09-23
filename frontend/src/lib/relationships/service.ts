import { db } from '@/lib/db';
import { objectRelationships, tasks, notes, meals, workoutRoutines, weightEntries, calendarConnections, financeTransactions, workoutSessions } from '@/lib/db/schema';
import { eq, and, or, inArray, isNull, sql } from 'drizzle-orm';

export type EntityType = 'task' | 'note' | 'workout' | 'weight' | 'food' | 'finance' | 'calendar';

export interface RelationshipInput {
  sourceType: EntityType | string;
  sourceId: string;
  targetType: EntityType | string;
  targetId: string;
  relationshipType?: string;
}

export class RelationshipService {
  /**
   * Links two objects together for a user.
   */
  static async linkObjects(userId: string, input: RelationshipInput) {
    // Check if link already exists in either direction
    const existing = await db.select().from(objectRelationships).where(
      and(
        eq(objectRelationships.userId, userId),
        or(
          and(
            eq(objectRelationships.sourceType, input.sourceType),
            eq(objectRelationships.sourceId, input.sourceId),
            eq(objectRelationships.targetType, input.targetType),
            eq(objectRelationships.targetId, input.targetId)
          ),
          and(
            eq(objectRelationships.sourceType, input.targetType),
            eq(objectRelationships.sourceId, input.targetId),
            eq(objectRelationships.targetType, input.sourceType),
            eq(objectRelationships.targetId, input.sourceId)
          )
        )
      )
    ).limit(1);

    if (existing.length > 0) {
      return existing[0]; // Already linked
    }

    const [rel] = await db.insert(objectRelationships).values({
      userId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      targetType: input.targetType,
      targetId: input.targetId,
      relationshipType: input.relationshipType || 'RELATED'
    }).returning();

    return rel;
  }

  /**
   * Unlinks two objects
   */
  static async unlinkObjects(userId: string, sourceId: string, targetId: string) {
    await db.delete(objectRelationships).where(
      and(
        eq(objectRelationships.userId, userId),
        or(
          and(eq(objectRelationships.sourceId, sourceId), eq(objectRelationships.targetId, targetId)),
          and(eq(objectRelationships.sourceId, targetId), eq(objectRelationships.targetId, sourceId))
        )
      )
    );
  }

  /**
   * Resolves relationships for a specific object and returns the full objects.
   * Trash aware: drops anything that is soft-deleted.
   */
  static async getRelatedObjects(userId: string, entityType: string, entityId: string) {
    const rawRels = await db.select().from(objectRelationships).where(
      and(
        eq(objectRelationships.userId, userId),
        or(
          and(eq(objectRelationships.sourceType, entityType), eq(objectRelationships.sourceId, entityId)),
          and(eq(objectRelationships.targetType, entityType), eq(objectRelationships.targetId, entityId))
        )
      )
    );

    if (rawRels.length === 0) return [];

    // Group related IDs by type
    const relatedByType: Record<string, string[]> = {};
    for (const rel of rawRels) {
      const isSource = rel.sourceId === entityId;
      const otherType = isSource ? rel.targetType : rel.sourceType;
      const otherId = isSource ? rel.targetId : rel.sourceId;
      
      if (!relatedByType[otherType]) relatedByType[otherType] = [];
      relatedByType[otherType].push(otherId);
    }

    const resolvedResults = [];

    // Resolve Tasks
    if (relatedByType['task']?.length) {
      const resolvedTasks = await db.select({
        id: tasks.id,
        title: tasks.title,
        subtitle: tasks.priority, // quick detail
      }).from(tasks).where(
        and(
          eq(tasks.userId, userId),
          inArray(tasks.id, relatedByType['task']),
          isNull(tasks.deletedAt)
        )
      );
      resolvedResults.push(...resolvedTasks.map(t => ({ ...t, _type: 'task' })));
    }

    // Resolve Notes
    if (relatedByType['note']?.length) {
      const resolvedNotes = await db.select({
        id: notes.id,
        title: notes.title,
        subtitle: sql<string>`substring(${notes.content} from 1 for 50)`,
      }).from(notes).where(
        and(
          eq(notes.userId, userId),
          inArray(notes.id, relatedByType['note']),
          isNull(notes.deletedAt)
        )
      );
      resolvedResults.push(...resolvedNotes.map(n => ({ ...n, _type: 'note' })));
    }

    // Resolve Workouts (Routines)
    if (relatedByType['workout']?.length) {
      const resolvedWorkouts = await db.select({
        id: workoutRoutines.id,
        title: workoutRoutines.name,
        subtitle: workoutRoutines.remark,
      }).from(workoutRoutines).where(
        and(
          eq(workoutRoutines.userId, userId),
          inArray(workoutRoutines.id, relatedByType['workout']),
          isNull(workoutRoutines.deletedAt)
        )
      );
      resolvedResults.push(...resolvedWorkouts.map(w => ({ ...w, _type: 'workout' })));
    }

    // Resolve Calendar (Events are not stored locally except as sync states, 
    // so we just pass back the remote event ID and a placeholder title. 
    // Usually the frontend would fetch real event details, or we store a title in the relationship table).
    // For MVP, we assume targetId is the remote event ID. We will return it raw.
    if (relatedByType['calendar']?.length) {
      resolvedResults.push(...relatedByType['calendar'].map(calId => ({
        id: calId,
        title: 'Calendar Event', // In a real app we'd fetch from Google Calendar API
        subtitle: 'Linked event',
        _type: 'calendar'
      })));
    }
    
    // Resolve Weight
    if (relatedByType['weight']?.length) {
      const resolvedWeights = await db.select({
        id: weightEntries.id,
        title: sql<string>`${weightEntries.weight} ${weightEntries.unit}`,
        subtitle: sql<string>`to_char(${weightEntries.recordedAt}, 'YYYY-MM-DD')`,
      }).from(weightEntries).where(
        and(
          eq(weightEntries.userId, userId),
          inArray(weightEntries.id, relatedByType['weight']),
          isNull(weightEntries.deletedAt)
        )
      );
      resolvedResults.push(...resolvedWeights.map(w => ({ ...w, _type: 'weight' })));
    }

    return resolvedResults;
  }
}
