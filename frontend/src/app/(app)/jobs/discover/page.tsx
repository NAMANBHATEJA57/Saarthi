"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, MapPin, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { JobCard } from "@/components/jobs/JobCard";

const JOB_TITLE_SUGGESTIONS = [
  "Software Engineer", "Product Manager", "Product Designer", 
  "Data Scientist", "Data Analyst", "Frontend Developer", 
  "Backend Developer", "Full Stack Developer", "UX Designer", 
  "UI Designer", "DevOps Engineer", "QA Engineer", "Project Manager"
];

const LOCATION_SUGGESTIONS = [
  "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Pune", 
  "Chennai", "Gurgaon", "Noida", "Remote", "New York", 
  "San Francisco", "London", "Singapore", "Dubai"
];

export default function JobDiscoverPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [remote, setRemote] = useState("any");
  const [jobType, setJobType] = useState("any");
  const [yoe, setYoe] = useState("any");

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSearching(true);
    setError(null);

    if (keywords.length === 0 || locations.length === 0) {
      setError("At least one keyword and one location are required.");
      setIsSearching(false);
      return;
    }

    try {
      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, locations, remote, jobType, yoe })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to search");
      
      setResults(data.jobs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Discover Jobs</h1>
        <p className="text-sm text-[hsl(var(--ink-muted))]">
          Search for new opportunities across multiple platforms.
        </p>
      </div>

      <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))] p-4 md:p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Keywords / Titles</label>
              <TagInput
                value={keywords}
                onChange={setKeywords}
                placeholder="e.g. UX Designer (press Enter)"
                icon={<Briefcase />}
                suggestions={JOB_TITLE_SUGGESTIONS}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Locations</label>
              <TagInput
                value={locations}
                onChange={setLocations}
                placeholder="e.g. Delhi (press Enter)"
                icon={<MapPin />}
                suggestions={LOCATION_SUGGESTIONS}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Remote</label>
              <Select value={remote} onValueChange={setRemote}>
                <SelectTrigger>
                  <SelectValue placeholder="Select remote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="remote">Remote Only</SelectItem>
                  <SelectItem value="onsite">On-site Only</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Job Type</label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="fulltime">Full-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="parttime">Part-time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Years of Experience</label>
              <Select value={yoe} onValueChange={setYoe}>
                <SelectTrigger>
                  <SelectValue placeholder="Select YOE" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="entry level">Entry Level (0-2 yrs)</SelectItem>
                  <SelectItem value="mid level">Mid Level (3-5 yrs)</SelectItem>
                  <SelectItem value="senior level">Senior Level (5+ yrs)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Posted</label>
              <Select defaultValue="any">
                <SelectTrigger>
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any time</SelectItem>
                  <SelectItem value="24h">Past 24 hours</SelectItem>
                  <SelectItem value="7d">Past week</SelectItem>
                  <SelectItem value="30d">Past month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="pt-2">
            <Button type="submit" disabled={isSearching} className="w-full md:w-auto">
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching jobs...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Jobs
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {isSearching && (
        <div className="flex flex-col items-center justify-center py-12 text-[hsl(var(--ink-muted))]">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Scanning LinkedIn, Indeed...</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !isSearching && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((job, idx) => (
            <JobCard key={job.id || idx} job={job} onSave={async (j) => {
              try {
                await fetch("/api/jobs/applications", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ jobId: j.id, status: "Saved" })
                });
                alert("Job saved!");
              } catch (e) {
                console.error(e);
                alert("Failed to save job");
              }
            }} />
          ))}
        </div>
      )}
      
      {!isSearching && results.length === 0 && !error && (
        <div className="text-center py-12 text-[hsl(var(--ink-muted))] text-sm">
          No results yet. Try searching for a job.
        </div>
      )}

      {error && (
        <div className="text-center py-4 text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
