"use client";

import { useTransition, useState, useEffect } from "react";
import { saveSettings } from "@/features/settings/actions";
import { Loader2 } from "lucide-react";

type SettingsData = {
  name: string;
  timezone: string;
  weekStartsOn: number;
  theme: "system" | "dark" | "light";
};

export function SettingsForm({ initialData }: { initialData: SettingsData }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  // Auto-detect timezone on mount if it's currently UTC
  useEffect(() => {
    if (initialData.timezone === "UTC") {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const select = document.getElementById("timezone") as HTMLSelectElement;
      if (select && detected) {
        select.value = detected;
      }
    }
  }, [initialData.timezone]);

  async function action(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await saveSettings(formData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Settings saved successfully." });
      }
    });
  }

  return (
    <form action={action} className="space-y-6">
      {message && (
        <div className={`p-3 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4 bg-[hsl(var(--surface))] p-5 rounded-lg border border-[hsl(var(--hairline))]">
        <h3 className="text-sm font-semibold">Profile</h3>
        
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-[hsl(var(--ink-secondary))]">Display Name</label>
          <input
            id="name"
            name="name"
            defaultValue={initialData.name}
            required
            maxLength={80}
            className="flex h-10 w-full rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-[hsl(var(--primary))]"
          />
        </div>
      </div>

      <div className="space-y-4 bg-[hsl(var(--surface))] p-5 rounded-lg border border-[hsl(var(--hairline))]">
        <h3 className="text-sm font-semibold">Preferences</h3>
        
        <div className="space-y-2">
          <label htmlFor="timezone" className="text-sm font-medium text-[hsl(var(--ink-secondary))]">Timezone</label>
          <select
            id="timezone"
            name="timezone"
            defaultValue={initialData.timezone}
            className="flex h-10 w-full rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-[hsl(var(--primary))]"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time (US & Canada)</option>
            <option value="America/Chicago">Central Time (US & Canada)</option>
            <option value="America/Denver">Mountain Time (US & Canada)</option>
            <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
            <option value="Asia/Kolkata">India Standard Time</option>
            {/* Can be expanded with a proper timezone list library later */}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="weekStartsOn" className="text-sm font-medium text-[hsl(var(--ink-secondary))]">Week Starts On</label>
          <select
            id="weekStartsOn"
            name="weekStartsOn"
            defaultValue={initialData.weekStartsOn}
            className="flex h-10 w-full rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-[hsl(var(--primary))]"
          >
            <option value={1}>Monday</option>
            <option value={0}>Sunday</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="theme" className="text-sm font-medium text-[hsl(var(--ink-secondary))]">Theme</label>
          <select
            id="theme"
            name="theme"
            defaultValue={initialData.theme}
            className="flex h-10 w-full rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-[hsl(var(--primary))]"
          >
            <option value="system">System Default</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center w-full h-10 rounded-md bg-[hsl(var(--primary))] text-primary-foreground font-medium text-sm hover:bg-[hsl(var(--primary-active))] transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
      </button>
    </form>
  );
}
