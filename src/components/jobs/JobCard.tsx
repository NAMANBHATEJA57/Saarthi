import { Briefcase, MapPin, DollarSign, Calendar, ExternalLink, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

export function JobCard({ job, onSave }: { job: any, onSave?: (job: any) => void }) {
  return (
    <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))] p-4 transition-all hover:border-[hsl(var(--ink-muted))] flex flex-col justify-between group">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-[hsl(var(--ink))] line-clamp-1">{job.title}</h3>
            <p className="text-sm text-[hsl(var(--ink-secondary))]">{job.company}</p>
          </div>
          {job.company_logo && (
            <img src={job.company_logo} alt={job.company} className="w-10 h-10 rounded-md object-contain bg-white border border-[hsl(var(--hairline))]" />
          )}
        </div>
        
        <div className="space-y-1.5 mt-4 text-xs text-[hsl(var(--ink-muted))]">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>{job.location || "Location not specified"}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5" />
            <span>
              {job.salary_min && job.salary_max 
                ? `${job.salary_currency || '$'}${job.salary_min} - ${job.salary_max} / ${job.salary_interval || 'yr'}`
                : "Salary not listed"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-3.5 h-3.5" />
            <span className="capitalize">{job.job_type || "Full-time"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{job.date_posted ? new Date(job.date_posted).toLocaleDateString() : "Recently"}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex items-center justify-between gap-2 border-t border-[hsl(var(--hairline))] pt-4">
        <span className="text-[10px] font-semibold text-[hsl(var(--ink-muted))] capitalize px-2 py-1 rounded bg-[hsl(var(--surface-elevated))]">
          {job.source}
        </span>
        
        <div className="flex items-center gap-2">
          {onSave && (
            <Button variant="utility" onClick={() => onSave(job)} className="h-8 text-xs py-1 px-3">
              <Bookmark className="w-3.5 h-3.5 mr-1.5" />
              Save
            </Button>
          )}
          {job.job_url && (
            <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center font-medium transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] disabled:opacity-50 disabled:pointer-events-none bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary-active))] rounded-full px-4 py-1.5 text-xs shadow-sm h-8">
              Apply <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
