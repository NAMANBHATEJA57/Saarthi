import { db } from '../db';
import { tasks } from '../db/schema';
import { eq, and, desc, isNull, isNotNull, asc, sql, lte, gt } from 'drizzle-orm';

export async function getOpenTasks(userId: string) {
  return await db.select()
    .from(tasks)
    .where(and(
      eq(tasks.userId, userId),
      isNull(tasks.completedAt),
      isNull(tasks.deletedAt)
    ))
    .orderBy(
      // High (1), Normal (2), Low (3) - Since we store strings, we map them in SQL
      sql`CASE WHEN ${tasks.priority} = 'high' THEN 1 WHEN ${tasks.priority} = 'normal' THEN 2 ELSE 3 END`,
      asc(tasks.position),
      asc(tasks.createdAt)
    );
}

export async function getCompletedTasks(userId: string) {
  return await db.select()
    .from(tasks)
    .where(and(
      eq(tasks.userId, userId),
      isNotNull(tasks.completedAt),
      isNull(tasks.deletedAt)
    ))
    .orderBy(desc(tasks.completedAt));
}

export async function getTodayTasksSummary(userId: string, todayDateString: string) {
  // Tasks due today or overdue
  const dueTasks = await db.select()
    .from(tasks)
    .where(and(
      eq(tasks.userId, userId),
      isNull(tasks.completedAt),
      isNull(tasks.deletedAt),
      isNotNull(tasks.dueDate),
      lte(tasks.dueDate, todayDateString)
    ))
    .orderBy(
      asc(tasks.dueDate), // oldest (most overdue) first
      sql`CASE WHEN ${tasks.priority} = 'high' THEN 1 WHEN ${tasks.priority} = 'normal' THEN 2 ELSE 3 END`,
      asc(tasks.position)
    );

  return dueTasks;
}

export async function createTask(userId: string, data: { title: string; remark?: string; priority?: string; dueDate?: string | null }) {
  const [task] = await db.insert(tasks).values({
    userId,
    title: data.title.trim(),
    remark: data.remark?.trim() || null,
    priority: data.priority || 'normal',
    dueDate: data.dueDate || null,
    position: Date.now(), // simple timestamp-based append position
  }).returning();
  return task;
}

export async function updateTask(userId: string, taskId: string, data: Partial<typeof tasks.$inferInsert>) {
  // Prevent overriding ownership or timestamps accidentally
  const cleanData = { ...data, updatedAt: new Date() };
  delete cleanData.id;
  delete cleanData.userId;
  delete cleanData.createdAt;

  const [updated] = await db.update(tasks)
    .set(cleanData)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning();
  return updated;
}
