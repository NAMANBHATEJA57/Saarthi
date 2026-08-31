import { db } from '@/lib/db';
import { weightEntries } from '@/lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export interface AddWeightInput {
  userId: string;
  weight: number;
  unit?: string;
  note?: string;
  recordedAt?: Date;
}

export class WeightService {
  /**
   * Adds a new weight entry for a user
   */
  static async addEntry(input: AddWeightInput) {
    const [entry] = await db.insert(weightEntries).values({
      userId: input.userId,
      weight: input.weight.toString(), // numeric maps to string in drizzle inserting usually, or number depending on driver, lets cast to string safely
      unit: input.unit || 'kg',
      note: input.note,
      recordedAt: input.recordedAt || new Date(),
    }).returning();
    return entry;
  }

  /**
   * Retrieves weight history for a user, ordered by most recent first
   */
  static async getHistory(userId: string, limit = 100) {
    return db.query.weightEntries.findMany({
      where: and(
        eq(weightEntries.userId, userId),
        isNull(weightEntries.deletedAt)
      ),
      orderBy: [desc(weightEntries.recordedAt)],
      limit,
    });
  }

  /**
   * Soft deletes a weight entry
   */
  static async deleteEntry(userId: string, entryId: string) {
    const [entry] = await db.update(weightEntries)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(weightEntries.id, entryId),
        eq(weightEntries.userId, userId)
      ))
      .returning();
    return entry;
  }
}
