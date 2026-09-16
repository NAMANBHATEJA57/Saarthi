export default function JobsOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs Dashboard</h1>
          <p className="text-sm text-[hsl(var(--ink-muted))]">
            Overview of your saved jobs and applications.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder Stats */}
        <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))] p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-[hsl(var(--ink-muted))]">Saved</span>
          <span className="text-3xl font-bold">12</span>
        </div>
        <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))] p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-[hsl(var(--ink-muted))]">Applied</span>
          <span className="text-3xl font-bold">8</span>
        </div>
        <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))] p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-[hsl(var(--ink-muted))]">Interview</span>
          <span className="text-3xl font-bold">3</span>
        </div>
        <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))] p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-[hsl(var(--ink-muted))]">Offers</span>
          <span className="text-3xl font-bold">1</span>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Recent Applications</h2>
        <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))]">
          <div className="p-4 text-sm text-[hsl(var(--ink-muted))] text-center">
            You don't have any applications yet.
          </div>
        </div>
      </div>
    </div>
  );
}
