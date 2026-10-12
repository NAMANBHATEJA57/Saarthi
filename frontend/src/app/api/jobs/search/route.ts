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
    const { keywords, locations, remote, jobType, sources, yoe, datePosted, offset } = body;

    if (!keywords || keywords.length === 0 || (!locations || locations.length === 0) && remote !== "remote") {
      return NextResponse.json({ error: "At least one keyword is required, and a location is required unless 'Remote Only' is selected." }, { status: 400 });
    }

    // Append YOE to keywords if specified
    const finalKeywords = yoe && yoe !== "any"
      ? keywords.map((k: string) => `${k} ${yoe} experience`)
      : keywords;

    let hoursOld: number | undefined = undefined;
    if (datePosted === "24h") hoursOld = 24;
    else if (datePosted === "7d") hoursOld = 168;
    else if (datePosted === "30d") hoursOld = 720;

    const jobs = await JobService.searchAndSave(session.user.id, {
      keywords: finalKeywords,
      locations,
      remote: remote || "any",
      jobType: jobType || "any",
      sources: sources || ["indeed", "linkedin", "glassdoor", "zip_recruiter"],
      hoursOld,
      offset: offset || 0
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
