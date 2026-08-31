import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { calendarConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function CalendarSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const connections = await db.select().from(calendarConnections).where(eq(calendarConnections.userId, session.user.id));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar Connections</h1>
        <p className="text-muted-foreground text-sm mt-1">Connect external calendars to sync your Saarthi tasks and view external events.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Manage your connected calendar providers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connections.length === 0 ? (
            <p className="text-sm text-[hsl(var(--ink-secondary))]">No accounts connected yet.</p>
          ) : (
            connections.map(conn => (
              <div key={conn.id} className="flex items-center justify-between p-3 border rounded-lg bg-[hsl(var(--surface))]">
                <div>
                  <p className="font-medium capitalize">{conn.provider}</p>
                  <p className="text-xs text-[hsl(var(--ink-secondary))]">{conn.email || 'Connected'}</p>
                </div>
                <form action={`/api/calendar/disconnect/${conn.id}`} method="POST">
                  <Button variant="secondary" size="sm" type="submit">Disconnect</Button>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New Connection</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <form action="/api/calendar/connect/google" method="GET">
            <Button variant="secondary" type="submit">Connect Google Calendar</Button>
          </form>
          <form action="/api/calendar/connect/microsoft" method="GET">
            <Button variant="secondary" type="submit" disabled>Connect Microsoft (Soon)</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
