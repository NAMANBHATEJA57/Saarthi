import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { NotesClient } from './NotesClient';
import { getNotes } from '@/lib/notes/service';

export default async function NotesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const notes = await getNotes(session.user.id);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notes</h1>
      </header>
      <NotesClient initialNotes={notes} />
    </div>
  );
}
