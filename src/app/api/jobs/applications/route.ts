import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { jobApplications, jobs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { jobId, status = "Saved" } = body;

    if (!jobId) return NextResponse.json({ error: "Job ID required" }, { status: 400 });

    // Check if application/saved record already exists
    const existing = await db.query.jobApplications.findFirst({
      where: and(
        eq(jobApplications.userId, session.user.id),
        eq(jobApplications.jobId, jobId)
      )
    });

    if (existing) {
      // Just update status if needed
      if (existing.status !== status) {
        await db.update(jobApplications)
          .set({ status, updatedAt: new Date() })
          .where(eq(jobApplications.id, existing.id));
      }
      return NextResponse.json({ application: { ...existing, status } });
    }

    const [newApp] = await db.insert(jobApplications).values({
      userId: session.user.id,
      jobId: jobId,
      status: status,
      appliedDate: status === "Applied" ? new Date() : null,
    }).returning();

    return NextResponse.json({ application: newApp });
  } catch (error: any) {
    console.error("Save/Apply Job Error:", error);
    return NextResponse.json({ error: "Failed to save job", details: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    // We need to join with jobs table to return job info
    const conditions = [eq(jobApplications.userId, session.user.id)];
    if (status) {
      conditions.push(eq(jobApplications.status, status));
    }

    const query = db.select({
      application: jobApplications,
      job: jobs
    })
    .from(jobApplications)
    .innerJoin(jobs, eq(jobApplications.jobId, jobs.id))
    .where(and(...conditions));

    const results = await query;
    return NextResponse.json({ applications: results });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}
