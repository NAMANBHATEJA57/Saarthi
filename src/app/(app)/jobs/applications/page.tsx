"use client";

import { useEffect, useState } from "react";
import { JobCard } from "@/components/jobs/JobCard";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = () => {
    fetch("/api/jobs/applications")
      .then(res => res.json())
      .then(data => {
        setApplications(data.applications || []);
        setIsLoading(false);
      });
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/jobs/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      setApplications(prev => prev.map(app => 
        app.application.id === id ? { ...app, application: { ...app.application, status } } : app
      ));
    } catch (e) {
      console.error(e);
    }
  };

  const [activeInterviewApp, setActiveInterviewApp] = useState<string | null>(null);

  const handleManualAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/jobs/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fd.get("title"),
          company: fd.get("company"),
          location: fd.get("location"),
          jobUrl: fd.get("jobUrl")
        })
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        fetchApplications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/jobs/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: activeInterviewApp,
          interviewDate: fd.get("date"),
          roundType: fd.get("roundType")
        })
      });
      if (res.ok) {
        setActiveInterviewApp(null);
        fetchApplications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredApps = applications.filter(app => {
    if (filter === "All") return app.application.status !== "Saved";
    return app.application.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
          <p className="text-sm text-[hsl(var(--ink-muted))]">
            Track your job applications and interviews.
          </p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button variant="primary">Add Manual Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Job Application</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleManualAdd} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Title</label>
                <Input name="title" required placeholder="Software Engineer" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <Input name="company" required placeholder="Acme Corp" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input name="location" placeholder="San Francisco / Remote" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Job URL (optional)</label>
                <Input name="jobUrl" type="url" placeholder="https://..." />
              </div>
              <Button type="submit" variant="primary" className="w-full">Save Application</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))] overflow-hidden">
        <div className="p-4 border-b border-[hsl(var(--hairline))] bg-[hsl(var(--surface-elevated))] flex gap-4">
          {["All", "Applied", "Interview", "Offer", "Rejected"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm font-medium pb-2 ${filter === f ? "text-[hsl(var(--ink))] border-b-2 border-[hsl(var(--primary))] -mb-[17px]" : "text-[hsl(var(--ink-muted))]"}`}
            >
              {f}
            </button>
          ))}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--ink-muted))]" /></div>
        ) : filteredApps.length === 0 ? (
          <div className="p-8 text-center text-[hsl(var(--ink-muted))]">
            No applications found for this filter.
          </div>
        ) : (
          <div className="p-4 grid gap-4 md:grid-cols-2">
            {filteredApps.map(({ application, job }) => (
              <div key={application.id} className="relative border border-[hsl(var(--hairline))] p-4 rounded-lg bg-[hsl(var(--background))]">
                <div className="mb-2 flex justify-between">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${
                    application.status === 'Offer' ? 'bg-green-100 text-green-700' :
                    application.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                    application.status === 'Interview' ? 'bg-blue-100 text-blue-700' :
                    'bg-[hsl(var(--surface-elevated))] text-[hsl(var(--ink))]'
                  }`}>
                    {application.status}
                  </span>
                  
                  {application.status === 'Applied' && (
                    <div className="flex gap-2">
                      <Button variant="utility" onClick={() => updateStatus(application.id, 'Interview')} className="text-xs h-7 py-0 px-2">
                        Move to Interview
                      </Button>
                    </div>
                  )}
                  {application.status === 'Interview' && (
                    <div className="flex gap-2">
                      <Button variant="utility" onClick={() => setActiveInterviewApp(application.id)} className="text-xs h-7 py-0 px-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))]">
                        Schedule
                      </Button>
                      <Button variant="utility" onClick={() => updateStatus(application.id, 'Offer')} className="text-xs h-7 py-0 px-2">
                        Mark Offer
                      </Button>
                    </div>
                  )}
                </div>
                
                <h3 className="font-semibold text-sm line-clamp-1">{job.title}</h3>
                <p className="text-xs text-[hsl(var(--ink-secondary))]">{job.company}</p>
                <div className="mt-2 text-xs text-[hsl(var(--ink-muted))]">
                  Applied: {new Date(application.appliedDate || application.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!activeInterviewApp} onOpenChange={(open) => !open && setActiveInterviewApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleScheduleInterview} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Interview Date</label>
              <Input name="date" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Round / Type</label>
              <Input name="roundType" placeholder="e.g. Technical, HR, Hiring Manager" required />
            </div>
            <Button type="submit" variant="primary" className="w-full">Schedule</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
