import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { JobService } from "@/lib/jobs/service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { keyword, location, remote, jobType, sources } = body;

    if (!keyword || !location) {
      return NextResponse.json({ error: "Keyword and location are required" }, { status: 400 });
    }

    const jobs = await JobService.searchAndSave(session.user.id, {
      keyword,
      location,
      remote: remote || "any",
      jobType: jobType || "any",
      sources: sources || ["indeed", "linkedin"]
    });

    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error("Job search API error:", error);
    return NextResponse.json(
      { error: "Failed to search jobs", details: error.message },
      { status: 500 }
    );
  }
}
