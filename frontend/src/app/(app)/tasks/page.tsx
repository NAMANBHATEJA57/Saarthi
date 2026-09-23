import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { TasksClient } from './TasksClient';
import { getOpenTasks, getCompletedTasks } from '@/lib/tasks/service';
import { getCalendarConnections, getTodayEvents } from '@/lib/calendar/service';
import { format } from 'date-fns';

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const openTasks = await getOpenTasks(session.user.id);
  const completedTasks = await getCompletedTasks(session.user.id);
  
  const connectedAccounts = await getCalendarConnections(session.user.id);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const calendarEvents = await getTodayEvents(session.user.id, todayStr);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
      </header>
      <TasksClient 
        initialOpenTasks={openTasks} 
        initialCompletedTasks={completedTasks} 
        connectedAccounts={connectedAccounts}
        calendarEvents={calendarEvents}
      />
    </div>
  );
}


