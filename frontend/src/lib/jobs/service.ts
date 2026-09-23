import { db } from "@/lib/db";
import { jobs, jobSearches, jobApplications, jobInterviews } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import crypto from "crypto";

export type ScrapedJob = {
  external_id?: string;
  title: string;
  company: string;
  company_url?: string;
  job_url?: string;
  location?: string;
  job_type?: string;
  date_posted?: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_interval?: string;
  source: string;
  company_logo?: string;
};

export class JobService {
  /**
   * Generates a deterministic hash for deduplication.
   * Strong signals:
   * 1. job_url (cleaned of query params)
   * 2. OR company + title + location (lowercased)
   */
  static generateDedupeHash(job: ScrapedJob): string {
    if (job.job_url) {
      try {
        const url = new URL(job.job_url);
        // LinkedIn and Indeed have very distinct path structures.
        // We strip query parameters which often contain tracking IDs.
        const cleanUrl = `${url.origin}${url.pathname}`;
        return crypto.createHash('sha256').update(`url:${cleanUrl}`).digest('hex');
      } catch (e) {
        // Fallback if URL is invalid
      }
    }
    
    // Fallback deterministic hash
    const title = (job.title || "").toLowerCase().trim();
    const company = (job.company || "").toLowerCase().trim();
    const loc = (job.location || "").toLowerCase().trim();
    return crypto.createHash('sha256').update(`attr:${company}:${title}:${loc}`).digest('hex');
  }

  static async searchAndSave(userId: string, params: {
    keywords: string[];
    locations: string[];
    remote: string;
    jobType: string;
    sources: string[];
  }) {
    // 1. Log the search
    await db.insert(jobSearches).values({
      userId,
      keyword: params.keywords.join(", "),
      location: params.locations.join(", "),
      remote: params.remote,
      jobType: params.jobType,
      sources: params.sources,
    });

    // 2. Call scraper service for each permutation
    const scraperUrl = process.env.SCRAPER_SERVICE_URL || "http://localhost:8000";
    
    try {
      const isRemote = params.remote === "remote";
      const dedupeHashes = new Set<string>();
      const jobsToInsert = [];

      for (const keyword of params.keywords) {
        for (const location of params.locations) {
          const payload = {
            search_term: keyword,
            location: location,
            site_names: params.sources,
            job_type: params.jobType === "any" ? "fulltime" : params.jobType,
            is_remote: isRemote,
            results_wanted: 15 // reduced slightly to balance multi-queries
          };

          const response = await fetch(`${scraperUrl}/scrape`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            console.error(`Scraper failed for ${keyword} in ${location} with status ${response.status}`);
            continue; // Skip failure and continue with other combinations
          }

          const data = await response.json();
          const scrapedJobs: ScrapedJob[] = data.jobs || [];

          // 3. Deduplicate and collect jobs
          for (const job of scrapedJobs) {
            const hash = this.generateDedupeHash(job);
            
            // Prevent duplicates within the entire batch run
            if (dedupeHashes.has(hash)) continue;
            dedupeHashes.add(hash);

            // Check if it already exists in DB
            const existing = await db.query.jobs.findFirst({
              where: and(
                eq(jobs.userId, userId),
                eq(jobs.dedupeHash, hash)
              )
            });

            if (!existing) {
              jobsToInsert.push({
                userId,
                title: job.title,
                company: job.company,
                companyUrl: job.company_url,
                jobUrl: job.job_url,
                location: job.location,
                jobType: job.job_type,
                description: job.description,
                salaryMin: job.salary_min,
                salaryMax: job.salary_max,
                salaryCurrency: job.salary_currency,
                salaryInterval: job.salary_interval,
                datePosted: job.date_posted ? new Date(job.date_posted) : null,
                source: job.source,
                externalId: job.external_id,
                dedupeHash: hash,
                companyLogo: job.company_logo,
                scrapedAt: new Date()
              });
            }
          }
        }
      }

      if (jobsToInsert.length > 0) {
        await db.insert(jobs).values(jobsToInsert);
      }

      // Return the jobs (both existing and newly inserted) for this search
      const hashesArray = Array.from(dedupeHashes);
      if (hashesArray.length === 0) return [];
      
      const savedJobs = await db.query.jobs.findMany({
        where: and(
          eq(jobs.userId, userId),
          inArray(jobs.dedupeHash, hashesArray)
        ),
        orderBy: [desc(jobs.datePosted)]
      });

      return savedJobs;

    } catch (error) {
      console.error("JobService.searchAndSave failed:", error);
      throw error;
    }
  }
}
