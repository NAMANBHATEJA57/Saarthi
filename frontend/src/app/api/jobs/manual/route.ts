import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { jobs, jobApplications } from "@/lib/db/schema";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, company, location, jobUrl, source = "Manual" } = body;

    if (!title || !company) {
      return NextResponse.json({ error: "Title and Company are required" }, { status: 400 });
    }

    const dedupeHash = crypto.createHash('sha256')
      .update(`manual:${company.toLowerCase()}:${title.toLowerCase()}`)
      .digest('hex');

    // Create Job
    const [newJob] = await db.insert(jobs).values({
      userId: session.user.id,
      title,
      company,
      location,
      jobUrl,
      source,
      dedupeHash,
    }).returning();

    // Create Application automatically
    const [newApp] = await db.insert(jobApplications).values({
      userId: session.user.id,
      jobId: newJob.id,
      status: "Applied",
      appliedDate: new Date(),
    }).returning();

    return NextResponse.json({ job: newJob, application: newApp });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to add manual job" }, { status: 500 });
  }
}
