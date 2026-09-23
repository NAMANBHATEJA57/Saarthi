"use client";

import { useEffect, useState } from "react";
import { JobCard } from "@/components/jobs/JobCard";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs/applications?status=Saved")
      .then(res => res.json())
      .then(data => {
        setSavedJobs(data.applications || []);
        setIsLoading(false);
      });
  }, []);

  const markAsApplied = async (id: string) => {
    try {
      await fetch(`/api/jobs/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Applied" })
      });
      // Remove from saved list
      setSavedJobs(prev => prev.filter(app => app.application.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Saved Jobs</h1>
        <p className="text-sm text-[hsl(var(--ink-muted))]">
          Jobs you've bookmarked for later.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--ink-muted))]" /></div>
      ) : savedJobs.length === 0 ? (
        <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))]">
          <div className="p-8 text-center text-[hsl(var(--ink-muted))]">
            No saved jobs yet. Go to Discover to find opportunities.
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {savedJobs.map(({ application, job }) => (
            <div key={application.id} className="relative">
              <JobCard job={job} />
              <div className="absolute top-2 right-2">
                <Button variant="utility" onClick={() => markAsApplied(application.id)} className="h-8 text-xs py-1 px-3 bg-white shadow-sm">
                  Mark as Applied
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
