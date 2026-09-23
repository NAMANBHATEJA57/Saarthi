import { db } from '@/lib/db';
import { calendarConnections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  htmlLink: string;
  accountEmail?: string;
}

export async function getCalendarConnections(userId: string) {
  return await db.select().from(calendarConnections).where(
    and(
      eq(calendarConnections.userId, userId),
      eq(calendarConnections.provider, 'google')
    )
  );
}

export async function getCalendarConnection(userId: string) {
  const connections = await getCalendarConnections(userId);
  return connections.length > 0 ? connections[0] : null;
}

export async function getCalendarConnectionById(id: string) {
  const connections = await db.select().from(calendarConnections).where(eq(calendarConnections.id, id)).limit(1);
  return connections.length > 0 ? connections[0] : null;
}

export async function getTodayEvents(userId: string, localDateStr: string): Promise<CalendarEvent[]> {
  const connections = await getCalendarConnections(userId);
  if (connections.length === 0) {
    return [];
  }
  
  // Use unstable_cache to avoid hitting the API on every render of the dashboard
  // Cache is keyed by user ID and the date string, valid for 5 minutes
  const fetchEvents = unstable_cache(
    async () => {
      // Create local boundary dates
      const startDate = new Date(localDateStr + 'T00:00:00');
      const endDate = new Date(localDateStr + 'T23:59:59');
      
      let allEvents: CalendarEvent[] = [];

      for (const connection of connections) {
        if (!connection.accessToken) continue;

        const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
        url.searchParams.append('timeMin', startDate.toISOString());
        url.searchParams.append('timeMax', endDate.toISOString());
        url.searchParams.append('singleEvents', 'true');
        url.searchParams.append('orderBy', 'startTime');

        try {
          const response = await fetch(url.toString(), {
            headers: { 'Authorization': `Bearer ${connection.accessToken}` },
          });

          if (!response.ok) {
            console.error('Failed to fetch calendar events for', connection.email, await response.text());
            continue;
          }

          const data = await response.json();
          
          const events = (data.items || []).map((item: any) => {
            const start = item.start.dateTime ? new Date(item.start.dateTime) : new Date(item.start.date);
            const end = item.end.dateTime ? new Date(item.end.dateTime) : new Date(item.end.date);
            return {
              id: item.id,
              summary: item.summary || 'Busy',
              description: item.description,
              location: item.location,
              start,
              end,
              isAllDay: !item.start.dateTime,
              htmlLink: item.htmlLink,
              accountEmail: connection.email,
            };
          });

          allEvents = [...allEvents, ...events];
        } catch (err) {
          console.error(err);
        }
      }

      return allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
    },
    [`calendar-events-${userId}-${localDateStr}-all`],
    { revalidate: 300 } // 5 minutes
  );

  return fetchEvents();
}

export async function pushEventToGoogleCalendar(connectionId: string, taskData: any) {
  const connection = await getCalendarConnectionById(connectionId);
  if (!connection || !connection.accessToken) throw new Error("Connection not found or missing token");

  const event: any = {
    summary: taskData.title,
    description: taskData.remark || '',
  };

  if (taskData.startTime && taskData.endTime) {
    event.start = { dateTime: taskData.startTime };
    event.end = { dateTime: taskData.endTime };
  } else if (taskData.startTime) {
    event.start = { dateTime: taskData.startTime };
    const end = new Date(new Date(taskData.startTime).getTime() + 60 * 60 * 1000);
    event.end = { dateTime: end.toISOString() };
  } else if (taskData.dueDate) {
    event.start = { date: taskData.dueDate };
    const end = new Date(new Date(taskData.dueDate).getTime() + 86400000);
    event.end = { date: end.toISOString().split('T')[0] };
  } else {
    const now = new Date();
    event.start = { date: now.toISOString().split('T')[0] };
    event.end = { date: new Date(now.getTime() + 86400000).toISOString().split('T')[0] };
  }

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${connection.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });

  if (!response.ok) {
    throw new Error(`Failed to push to Google Calendar: ${await response.text()}`);
  }

  const data = await response.json();
  return { eventId: data.id, provider: 'google' };
}
