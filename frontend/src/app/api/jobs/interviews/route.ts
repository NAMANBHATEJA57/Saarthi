import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { jobInterviews, jobApplications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { applicationId, interviewDate, roundType, notes } = body;

    // Verify application belongs to user
    const app = await db.query.jobApplications.findFirst({
      where: and(
        eq(jobApplications.id, applicationId),
        eq(jobApplications.userId, session.user.id)
      )
    });

    if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    const [interview] = await db.insert(jobInterviews).values({
      userId: session.user.id,
      applicationId,
      interviewDate: new Date(interviewDate),
      roundName: roundType,
      notes,
    }).returning();

    // Auto update status to Interview
    if (app.status !== "Interview") {
      await db.update(jobApplications)
        .set({ status: "Interview", updatedAt: new Date() })
        .where(eq(jobApplications.id, applicationId));
    }

    return NextResponse.json({ interview });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to schedule interview" }, { status: 500 });
  }
}
