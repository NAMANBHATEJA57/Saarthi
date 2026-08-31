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
}

export async function getCalendarConnection(userId: string) {
  const connections = await db.select().from(calendarConnections).where(
    and(
      eq(calendarConnections.userId, userId),
      eq(calendarConnections.provider, 'google')
    )
  ).limit(1);
  
  return connections.length > 0 ? connections[0] : null;
}

export async function getTodayEvents(userId: string, localDateStr: string): Promise<CalendarEvent[]> {
  const connection = await getCalendarConnection(userId);
  if (!connection || !connection.accessToken) {
    return [];
  }
  
  // Use unstable_cache to avoid hitting the API on every render of the dashboard
  // Cache is keyed by user ID and the date string, valid for 5 minutes
  const fetchEvents = unstable_cache(
    async () => {
      // Create local boundary dates
      const startDate = new Date(localDateStr + 'T00:00:00');
      const endDate = new Date(localDateStr + 'T23:59:59');
      
      const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
      url.searchParams.append('timeMin', startDate.toISOString());
      url.searchParams.append('timeMax', endDate.toISOString());
      url.searchParams.append('singleEvents', 'true');
      url.searchParams.append('orderBy', 'startTime');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`,
        },
      });

      if (response.status === 401) {
        console.warn('Calendar token expired or invalid');
        return [];
      }

      if (!response.ok) {
        console.error('Failed to fetch calendar events:', await response.text());
        return [];
      }

      const data = await response.json();
      
      return (data.items || []).map((item: any) => {
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
        };
      });
    },
    [`calendar-events-${userId}-${localDateStr}`],
    { revalidate: 300 } // 5 minutes
  );

  return fetchEvents();
}
