import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { jobApplications, jobInterviews, jobs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    
    await db.update(jobApplications)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(and(
        eq(jobApplications.id, params.id),
        eq(jobApplications.userId, session.user.id)
      ));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await db.select({
      application: jobApplications,
      job: jobs
    })
    .from(jobApplications)
    .innerJoin(jobs, eq(jobApplications.jobId, jobs.id))
    .where(and(
      eq(jobApplications.id, params.id),
      eq(jobApplications.userId, session.user.id)
    ))
    .limit(1);

    if (!result.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    // Fetch interviews
    const interviews = await db.query.jobInterviews.findMany({
      where: eq(jobInterviews.applicationId, params.id),
      orderBy: (interviews, { desc }) => [desc(interviews.interviewDate)]
    });

    return NextResponse.json({ ...result[0], interviews });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 });
  }
}
