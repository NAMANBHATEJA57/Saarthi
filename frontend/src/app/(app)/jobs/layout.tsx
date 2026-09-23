import Link from "next/link";
import { Briefcase, Search, Bookmark, FileText } from "lucide-react";

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-4 border-b border-[hsl(var(--hairline))] pb-4 overflow-x-auto">
        <Link
          href="/jobs"
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-[hsl(var(--surface))] transition-colors"
        >
          <Briefcase className="w-4 h-4" />
          Overview
        </Link>
        <Link
          href="/jobs/discover"
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-[hsl(var(--surface))] transition-colors"
        >
          <Search className="w-4 h-4" />
          Discover
        </Link>
        <Link
          href="/jobs/saved"
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-[hsl(var(--surface))] transition-colors"
        >
          <Bookmark className="w-4 h-4" />
          Saved
        </Link>
        <Link
          href="/jobs/applications"
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-[hsl(var(--surface))] transition-colors"
        >
          <FileText className="w-4 h-4" />
          Applications
        </Link>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
