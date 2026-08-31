import { Apple, Dumbbell, Scale, Shield, Settings, CheckSquare } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tasks, notes } from "@/lib/db/schema";
import { eq, isNull, isNotNull, and, lte } from "drizzle-orm";

export default async function OverviewPage() {
  const session = await auth();
  const userId = session?.user?.id;

  let openTasks = 0;
  let dueToday = 0;
  let completedTasks = 0;
  let activeNotes = 0;

  if (userId) {
    const dateObj = new Date();
    const todayDateString = dateObj.toLocaleDateString('en-CA');

    const [openRes, dueRes, compRes, notesRes] = await Promise.all([
      db.select().from(tasks).where(and(eq(tasks.userId, userId), isNull(tasks.completedAt), isNull(tasks.deletedAt))),
      db.select().from(tasks).where(and(eq(tasks.userId, userId), isNull(tasks.completedAt), isNull(tasks.deletedAt), isNotNull(tasks.dueDate), lte(tasks.dueDate, todayDateString))),
      db.select().from(tasks).where(and(eq(tasks.userId, userId), isNotNull(tasks.completedAt), isNull(tasks.deletedAt))),
      db.select().from(notes).where(and(eq(notes.userId, userId), isNull(notes.deletedAt)))
    ]);

    openTasks = openRes.length;
    dueToday = dueRes.length;
    completedTasks = compRes.length;
    activeNotes = notesRes.length;
  }
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-[hsl(var(--ink-secondary))]">
          Your personal data and module roadmap.
        </p>
      </header>

      {/* Tasks Overview */}
      {userId && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider">TASKS</h2>
            <Link href="/tasks" className="text-xs font-medium text-[hsl(var(--primary))] hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] text-center">
              <div className="text-2xl font-bold">{openTasks}</div>
              <div className="text-xs text-[hsl(var(--ink-secondary))]">Open</div>
            </div>
            <div className="p-4 rounded-lg bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] text-center">
              <div className="text-2xl font-bold text-red-500">{dueToday}</div>
              <div className="text-xs text-[hsl(var(--ink-secondary))]">Due Today / Overdue</div>
            </div>
            <div className="p-4 rounded-lg bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] text-center">
              <div className="text-2xl font-bold text-green-500">{completedTasks}</div>
              <div className="text-xs text-[hsl(var(--ink-secondary))]">Completed</div>
            </div>
          </div>
        </section>
      )}

      {/* Notes Overview */}
      {userId && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider">NOTES</h2>
            <Link href="/notes" className="text-xs font-medium text-[hsl(var(--primary))] hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 rounded-lg bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] flex items-center justify-between">
              <div className="text-sm font-medium">Active Notes</div>
              <div className="text-2xl font-bold">{activeNotes}</div>
            </div>
          </div>
        </section>
      )}

      {/* Module Roadmap */}
      <section>
        <h2 className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider mb-4">MODULE ROADMAP</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-lg bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[hsl(var(--primary))] opacity-10 blur-2xl rounded-full" />
            <Apple className="w-6 h-6 text-[hsl(var(--primary))] mb-3" />
            <h3 className="font-semibold text-sm mb-1">Food</h3>
            <p className="text-xs text-[hsl(var(--ink-secondary))] mb-4">Nutrition and meal tracking.</p>
            <span className="inline-flex items-center text-[10px] font-semibold tracking-wider text-[hsl(var(--primary))] bg-blue-500/10 px-2 py-1 rounded-full uppercase">
              Coming Next
            </span>
          </div>

          <div className="p-5 rounded-lg bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] opacity-70">
            <Dumbbell className="w-6 h-6 text-[hsl(var(--ink-muted))] mb-3" />
            <h3 className="font-semibold text-sm mb-1">Workout</h3>
            <p className="text-xs text-[hsl(var(--ink-secondary))] mb-4">Exercise tracking and programs.</p>
            <span className="inline-flex items-center text-[10px] font-semibold tracking-wider text-[hsl(var(--ink-muted))] bg-[hsl(var(--canvas))] border border-[hsl(var(--hairline))] px-2 py-1 rounded-full uppercase">
              Planned Later
            </span>
          </div>

          <div className="p-5 rounded-lg bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] opacity-70">
            <Scale className="w-6 h-6 text-[hsl(var(--ink-muted))] mb-3" />
            <h3 className="font-semibold text-sm mb-1">Weight</h3>
            <p className="text-xs text-[hsl(var(--ink-secondary))] mb-4">Body metrics and goals.</p>
            <span className="inline-flex items-center text-[10px] font-semibold tracking-wider text-[hsl(var(--ink-muted))] bg-[hsl(var(--canvas))] border border-[hsl(var(--hairline))] px-2 py-1 rounded-full uppercase">
              Planned Later
            </span>
          </div>
        </div>
      </section>

      {/* Privacy and Data */}
      <section>
        <h2 className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider mb-4">DATA & PRIVACY</h2>
        <div className="p-5 rounded-lg bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-4">
            <div className="p-2 bg-[hsl(var(--canvas))] rounded-md h-fit">
              <Shield className="w-5 h-5 text-[hsl(var(--ink-secondary))]" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Your data is private</h3>
              <p className="text-xs text-[hsl(var(--ink-secondary))] max-w-md">
                Saarthi is a single-tenant application. Your data is never shared, sold, or used to train AI models.
              </p>
            </div>
          </div>
          <Link 
            href="/settings"
            className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--surface-elevated))] hover:bg-[hsl(var(--hairline))] border border-[hsl(var(--hairline))] rounded-md text-xs font-medium transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Manage Settings
          </Link>
        </div>
      </section>
    </div>
  );
}
