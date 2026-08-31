import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { RelationshipService } from '../relationships/service';

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  related?: any[];
}

export class SearchService {
  /**
   * Executes a high-performance UNION ALL query across domains.
   * Limits results and enforces user isolation at the database level.
   */
  static async globalSearch(userId: string, query: string, limit = 20): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) return [];

    const term = `%${query.trim()}%`;

    // We use a parameterized raw SQL query to cleanly UNION ALL different tables
    // while maintaining strict user isolation and avoiding application-side merging overhead.
    const results = await db.execute(sql`
      SELECT 'task' as type, id, title, priority as subtitle 
      FROM tasks 
      WHERE user_id = ${userId} AND deleted_at IS NULL AND (title ILIKE ${term} OR remark ILIKE ${term})
      
      UNION ALL
      
      SELECT 'note' as type, id, title, substring(content from 1 for 50) as subtitle 
      FROM notes 
      WHERE user_id = ${userId} AND deleted_at IS NULL AND (title ILIKE ${term} OR content ILIKE ${term})
      
      UNION ALL
      
      SELECT 'workout' as type, id, name as title, remark as subtitle 
      FROM workout_routines 
      WHERE user_id = ${userId} AND deleted_at IS NULL AND (name ILIKE ${term} OR remark ILIKE ${term})
      
      UNION ALL
      
      SELECT 'weight' as type, id, weight::text || ' ' || unit as title, to_char(recorded_at, 'YYYY-MM-DD') as subtitle
      FROM weight_entries
      WHERE user_id = ${userId} AND deleted_at IS NULL AND (note ILIKE ${term})
      
      LIMIT ${limit}
    `);

    const parsedResults: SearchResult[] = results.rows.map((row: any) => ({
      id: String(row.id),
      type: String(row.type),
      title: String(row.title),
      subtitle: row.subtitle ? String(row.subtitle) : null,
    }));

    // To prevent N+1 queries during search, we don't automatically load relationships for everything.
    // However, if the user requested relationships to surface in search results, we can do a bulk load here
    // or just fetch relationships for the top 5 results to keep it extremely fast.
    const topResults = parsedResults.slice(0, 5);
    for (const res of topResults) {
      res.related = await RelationshipService.getRelatedObjects(userId, res.type, res.id);
    }

    return parsedResults;
  }
}
