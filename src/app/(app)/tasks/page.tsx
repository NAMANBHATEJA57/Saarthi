import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { TasksClient } from './TasksClient';
import { getOpenTasks, getCompletedTasks } from '@/lib/tasks/service';

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const openTasks = await getOpenTasks(session.user.id);
  const completedTasks = await getCompletedTasks(session.user.id);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
      </header>
      <TasksClient initialOpenTasks={openTasks} initialCompletedTasks={completedTasks} />
    </div>
  );
}
