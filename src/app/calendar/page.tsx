import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { CalendarClient } from './CalendarClient';
import { getOpenTasks } from '@/lib/tasks/service';

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const openTasks = await getOpenTasks(session.user.id);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
      </header>
      <CalendarClient initialTasks={openTasks} />
    </div>
  );
}
