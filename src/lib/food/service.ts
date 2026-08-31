import { db } from '../db';
import { eq, and, desc, sql, ilike } from 'drizzle-orm';
import { foodSearchCache, foodSourceRecords, foodNutrients, foodPortions, userFoods, foodSources } from '../db/schema';
import { USDAAdapter } from './adapters/usda';
import { OpenFoodFactsAdapter } from './adapters/openFoodFacts';
import { IFCTAdapter } from './adapters/ifct';
import { CuratedIndianAdapter } from './adapters/curated';
import { FoodSourceAdapter, NormalizedFoodRecord, SearchResult } from './types';

const adapters: Record<string, FoodSourceAdapter> = {
  usda: new USDAAdapter(),
  open_food_facts: new OpenFoodFactsAdapter(),
  ifct: new IFCTAdapter(),
  curated: new CuratedIndianAdapter(),
};

const DEFAULT_SOURCES = [
  { id: 'usda', displayName: 'USDA FoodData Central' },
  { id: 'open_food_facts', displayName: 'Open Food Facts' },
  { id: 'ifct', displayName: 'Indian Food Composition Tables' },
  { id: 'curated', displayName: 'Curated Indian Foods' },
];

let sourcesEnsured = false;
async function ensureFoodSources() {
  if (sourcesEnsured) return;
  try {
    await db.insert(foodSources).values(DEFAULT_SOURCES).onConflictDoNothing();
    sourcesEnsured = true;
  } catch (e) {
    console.error('Failed to ensure food sources:', e);
  }
}

export class FoodService {
  async search(query: string, userId: string): Promise<SearchResult[]> {
    await ensureFoodSources();
    const results: SearchResult[] = [];
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    // 1. Search Personal Foods (Custom & Overrides)
    // Using ILIKE fallback if pg_trgm is not explicitly utilized via raw SQL, though we did create the extension.
    // For MVP, Drizzle ILIKE %query% is acceptable fallback.
    const personal = await db.select().from(userFoods)
      .where(and(eq(userFoods.userId, userId), ilike(userFoods.name, `%${normalizedQuery}%`)));

    for (const p of personal) {
      // Calculate match score: Exact match = 100, partial = 50
      const matchScore = p.name.toLowerCase() === normalizedQuery ? 100 : 50;
      results.push({
        sourceId: 'personal',
        externalId: p.id,
        identity: p.name,
        reliabilityScore: 100, // Personal is always trusted
        freshnessScore: 100,
        completenessScore: 100,
        matchScore,
      });
    }

    // 2. Search Public Adapters with Cache
    for (const [sourceId, adapter] of Object.entries(adapters)) {
      const publicResults = await this.searchSourceWithCache(adapter, normalizedQuery);
      results.push(...publicResults.map(r => this.scoreResult(sourceId, r, normalizedQuery)));
    }

    // 3. Deduplicate and Rank
    return this.deduplicateAndRank(results);
  }

  private async searchSourceWithCache(adapter: FoodSourceAdapter, query: string): Promise<NormalizedFoodRecord[]> {
    // Check Cache (Valid for 30 days)
    const cached = await db.select().from(foodSearchCache).where(
      and(
        eq(foodSearchCache.sourceKey, adapter.sourceId),
        eq(foodSearchCache.queryKey, query),
        sql`${foodSearchCache.expiresAt} > now()`
      )
    ).limit(1);

    if (cached.length > 0) {
      // Return referenced records from DB
      const refs = cached[0].resultRefs as string[];
      if (refs.length === 0) return [];
      
      const records = await db.select().from(foodSourceRecords)
        .where(sql`${foodSourceRecords.externalId} IN ${refs}`);
      
      // We would need to populate nutrients and portions here, but for search results,
      // we primarily need identity and externalId. To strictly return NormalizedFoodRecord, 
      // we should fetch them. For performance in MVP, we might only need partial data for search list.
      // Assuming we just map what we have:
      return records.map(r => ({
        sourceId: r.sourceId,
        externalId: r.externalId,
        normalizedRecordVersion: r.normalizedRecordVersion,
        normalizedIdentity: r.normalizedIdentity,
        provenance: r.provenance,
        nutrients: [], // lazy load on detail
        portions: [], // lazy load on detail
        fetchedAt: r.fetchedAt,
      }));
    }

    // Cache miss or expired, fetch from adapter
    const liveResults = await adapter.search(query);
    
    // Save to Cache and DB
    if (liveResults.length > 0) {
      // Save records (UPSERT would be better, but simplified for MVP)
      for (const record of liveResults) {
        await this.saveFoodRecord(record);
      }
      
      // Save Cache entry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
      const staleAt = new Date();
      staleAt.setDate(staleAt.getDate() + 7); // 7 days stale

      await db.insert(foodSearchCache).values({
        sourceKey: adapter.sourceId,
        queryKey: query,
        resultRefs: liveResults.map(r => r.externalId),
        expiresAt,
        staleAt,
      });
    }

    return liveResults;
  }

  private async saveFoodRecord(record: NormalizedFoodRecord) {
    // Simplified UPSERT logic
    const existing = await db.select().from(foodSourceRecords).where(
      and(
        eq(foodSourceRecords.sourceId, record.sourceId),
        eq(foodSourceRecords.externalId, record.externalId)
      )
    );

    let dbRecordId: string;

    if (existing.length === 0) {
      const inserted = await db.insert(foodSourceRecords).values({
        sourceId: record.sourceId,
        externalId: record.externalId,
        normalizedRecordVersion: record.normalizedRecordVersion,
        normalizedIdentity: record.normalizedIdentity,
        provenance: record.provenance,
      }).returning({ id: foodSourceRecords.id });
      dbRecordId = inserted[0].id;
    } else {
      dbRecordId = existing[0].id;
      // We could update here if needed
    }

    // Add nutrients if they don't exist
    const existingNuts = await db.select().from(foodNutrients).where(eq(foodNutrients.recordId, dbRecordId));
    if (existingNuts.length === 0 && record.nutrients.length > 0) {
      await db.insert(foodNutrients).values(
        record.nutrients.map(n => ({
          recordId: dbRecordId,
          nutrientKey: n.key,
          amount: n.amount.toString(),
          unit: n.unit,
          basis: n.basis,
          status: n.status,
        }))
      );
    }

    // Add portions if they don't exist
    const existingPorts = await db.select().from(foodPortions).where(eq(foodPortions.recordId, dbRecordId));
    if (existingPorts.length === 0 && record.portions.length > 0) {
      await db.insert(foodPortions).values(
        record.portions.map(p => ({
          recordId: dbRecordId,
          label: p.label,
          grams: p.grams?.toString(),
          milliliters: p.milliliters?.toString(),
          ordering: p.ordering,
        }))
      );
    }
  }

  private scoreResult(sourceId: string, record: NormalizedFoodRecord, query: string): SearchResult {
    // Deterministic ranking: Custom(handled in deduplicate) > Curated > Packaged > Ingredients
    const matchScore = record.normalizedIdentity.toLowerCase() === query ? 90 : 
                      (record.normalizedIdentity.toLowerCase().includes(query) ? 70 : 40);
    
    let reliabilityScore = 50;
    if (sourceId === 'curated') reliabilityScore = 100;
    else if (sourceId === 'open_food_facts') reliabilityScore = 80;
    else if (sourceId === 'usda' || sourceId === 'ifct') reliabilityScore = 70;
    
    return {
      sourceId,
      externalId: record.externalId,
      identity: record.normalizedIdentity,
      reliabilityScore,
      freshnessScore: 100, // Just fetched or cached
      completenessScore: record.nutrients?.length > 5 ? 100 : 50,
      matchScore,
    };
  }

  async searchExternal(query: string, sourceId: string): Promise<SearchResult[]> {
    await ensureFoodSources();
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const adapter = adapters[sourceId];
    if (!adapter) {
      throw new Error(`Adapter ${sourceId} not found`);
    }

    // Transient search - no DB writing
    const liveResults = await adapter.search(normalizedQuery);
    
    // Map to SearchResult for consistency
    const results = liveResults.map(r => this.scoreResult(sourceId, r, normalizedQuery));
    return this.deduplicateAndRank(results);
  }

  async resolveAndPersist(sourceId: string, externalId: string): Promise<string | null> {
    await ensureFoodSources();
    const adapter = adapters[sourceId];
    if (!adapter) throw new Error(`Adapter ${sourceId} not found`);

    // 1. Check if we already persisted this exact external record
    const existing = await db.select().from(foodSourceRecords).where(
      and(
        eq(foodSourceRecords.sourceId, sourceId),
        eq(foodSourceRecords.externalId, externalId)
      )
    ).limit(1);

    if (existing.length > 0) {
      return existing[0].id; // Already saved
    }

    // 2. Fetch full details from adapter
    const record = await adapter.getDetail(externalId);
    if (!record) return null;

    // 3. Persist to DB since user selected it
    const inserted = await db.insert(foodSourceRecords).values({
      sourceId: record.sourceId,
      externalId: record.externalId,
      normalizedRecordVersion: record.normalizedRecordVersion,
      normalizedIdentity: record.normalizedIdentity,
      provenance: record.provenance,
    }).returning({ id: foodSourceRecords.id });
    
    const dbRecordId = inserted[0].id;

    if (record.nutrients.length > 0) {
      await db.insert(foodNutrients).values(
        record.nutrients.map(n => ({
          recordId: dbRecordId,
          nutrientKey: n.key,
          amount: n.amount.toString(),
          unit: n.unit,
          basis: n.basis,
          status: n.status,
        }))
      );
    }

    if (record.portions.length > 0) {
      await db.insert(foodPortions).values(
        record.portions.map(p => ({
          recordId: dbRecordId,
          label: p.label,
          grams: p.grams?.toString(),
          milliliters: p.milliliters?.toString(),
          ordering: p.ordering,
        }))
      );
    }

    return dbRecordId;
  }

  private deduplicateAndRank(results: SearchResult[]): SearchResult[] {
    // Deduplication: Group by identity and pick the highest ranked source
    const uniqueMap = new Map<string, SearchResult>();
    
    for (const r of results) {
      const key = r.identity.toLowerCase();
      // Calculate total score
      const totalScore = (r.matchScore * 0.4) + (r.reliabilityScore * 0.3) + (r.completenessScore * 0.3);
      
      // Personal items always bypass deduplication and get a massive boost
      if (r.sourceId === 'personal') {
        uniqueMap.set(`personal-${r.externalId}`, { ...r, matchScore: r.matchScore + 500 });
        continue;
      }

      if (uniqueMap.has(key)) {
        const existing = uniqueMap.get(key)!;
        const existingScore = (existing.matchScore * 0.4) + (existing.reliabilityScore * 0.3) + (existing.completenessScore * 0.3);
        
        if (totalScore > existingScore) {
          uniqueMap.set(key, r);
        }
      } else {
        uniqueMap.set(key, r);
      }
    }

    // Sort by final score descending
    return Array.from(uniqueMap.values()).sort((a, b) => {
      const scoreA = (a.matchScore * 0.4) + (a.reliabilityScore * 0.3) + (a.completenessScore * 0.3);
      const scoreB = (b.matchScore * 0.4) + (b.reliabilityScore * 0.3) + (b.completenessScore * 0.3);
      return scoreB - scoreA;
    });
  }
}

export const foodService = new FoodService();
