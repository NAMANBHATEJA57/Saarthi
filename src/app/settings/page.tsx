import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { userPreferences, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SettingsForm } from "./SettingsForm";
import { SettingsFinanceSection } from "@/components/settings/SettingsFinanceSection";
import { LogOut } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  let userName = session?.user?.name || "";
  const email = session?.user?.email || "";

  let initialData = {
    name: userName,
    timezone: "UTC",
    weekStartsOn: 1,
    theme: "system" as "system" | "dark" | "light",
  };

  if (userId) {
    const userRec = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userRec.length > 0 && userRec[0].name) {
      userName = userRec[0].name;
    }
    initialData.name = userName;

    const prefs = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
    if (prefs.length > 0) {
      initialData = {
        name: userName,
        timezone: prefs[0].timezone,
        weekStartsOn: prefs[0].weekStartsOn,
        theme: prefs[0].theme as "system" | "dark" | "light",
      };
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-[hsl(var(--ink-secondary))]">
          Manage your account and application preferences.
        </p>
      </header>

      <SettingsForm initialData={initialData} />

      <div className="space-y-4 bg-[hsl(var(--surface))] p-5 rounded-lg border border-[hsl(var(--hairline))]">
        <h3 className="text-sm font-semibold">Account</h3>
        <div className="text-sm text-[hsl(var(--ink-secondary))]">
          Signed in as <span className="font-medium text-[hsl(var(--ink))]">{email}</span>
        </div>
        
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/sign-in" });
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 mt-4 rounded-md bg-[hsl(var(--canvas))] border border-[hsl(var(--hairline))] text-sm font-medium hover:bg-[hsl(var(--surface-elevated))] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </form>
      </div>

      <SettingsFinanceSection />

      <div className="space-y-4 bg-[hsl(var(--surface))] p-5 rounded-lg border border-[hsl(var(--hairline))]">
        <h3 className="text-sm font-semibold">Data Export</h3>
        <p className="text-xs text-[hsl(var(--ink-secondary))]">
          Download a JSON archive of all your personal data.
        </p>
        <a
          href="/api/settings/export"
          download
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--surface))] text-sm font-medium hover:opacity-90"
        >
          Export Data
        </a>
      </div>
    </div>
  );
}
