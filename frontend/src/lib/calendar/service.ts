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

export type CalendarConnectionType = typeof calendarConnections.$inferSelect;

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

/**
 * Attempts to refresh an expired Google access token using the stored refresh_token.
 */
export async function refreshGoogleAccessToken(connection: CalendarConnectionType): Promise<string | null> {
  if (!connection.refreshToken) {
    return null;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[Google Calendar] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables');
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Google Calendar] Token refresh failed for ${connection.email || 'account'}: ${errText}`);
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access_token as string;
    const nowSec = Math.floor(Date.now() / 1000);
    const newExpiresAt = data.expires_in ? nowSec + (data.expires_in as number) : null;

    // Update database with refreshed token
    await db
      .update(calendarConnections)
      .set({
        accessToken: newAccessToken,
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(calendarConnections.id, connection.id));

    return newAccessToken;
  } catch (err) {
    console.error(`[Google Calendar] Error refreshing token for ${connection.email}:`, err);
    return null;
  }
}

/**
 * Returns a valid access token for the given connection, refreshing if expired.
 */
export async function getValidAccessToken(connection: CalendarConnectionType): Promise<string | null> {
  const nowSec = Math.floor(Date.now() / 1000);

  // If token is still valid (with 2 min buffer), return it
  if (connection.accessToken && connection.expiresAt && connection.expiresAt > nowSec + 120) {
    return connection.accessToken;
  }

  // Token is expired or expiring soon; attempt refresh
  if (connection.refreshToken) {
    const refreshed = await refreshGoogleAccessToken(connection);
    if (refreshed) return refreshed;
  }

  // Fallback to existing token if no expiresAt was recorded
  if (connection.accessToken && !connection.expiresAt) {
    return connection.accessToken;
  }

  return null;
}

export async function getTodayEvents(userId: string, localDateStr: string): Promise<CalendarEvent[]> {
  const connections = await getCalendarConnections(userId);
  if (connections.length === 0) {
    return [];
  }
  
  // Use unstable_cache to avoid hitting the API on every render of the dashboard
  const fetchEvents = unstable_cache(
    async () => {
      const startDate = new Date(localDateStr + 'T00:00:00');
      const endDate = new Date(localDateStr + 'T23:59:59');
      
      let allEvents: CalendarEvent[] = [];

      for (const connection of connections) {
        let accessToken = await getValidAccessToken(connection);
        if (!accessToken) {
          // Token is missing or invalid/expired
          continue;
        }

        const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
        url.searchParams.append('timeMin', startDate.toISOString());
        url.searchParams.append('timeMax', endDate.toISOString());
        url.searchParams.append('singleEvents', 'true');
        url.searchParams.append('orderBy', 'startTime');

        try {
          let response = await fetch(url.toString(), {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          // If 401, attempt one immediate refresh and retry
          if (response.status === 401 && connection.refreshToken) {
            const refreshed = await refreshGoogleAccessToken(connection);
            if (refreshed) {
              accessToken = refreshed;
              response = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${accessToken}` },
              });
            }
          }

          if (!response.ok) {
            if (response.status === 401) {
              console.warn(`[Google Calendar] Credentials expired for ${connection.email}. Please reconnect the account.`);
            } else {
              console.error('Failed to fetch calendar events for', connection.email, await response.text());
            }
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
          console.error('[Google Calendar] Request error for', connection.email, err);
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
  if (!connection) throw new Error("Calendar connection not found");

  const accessToken = await getValidAccessToken(connection);
  if (!accessToken) throw new Error("Google Calendar authentication expired. Please reconnect your account in Settings.");

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
      'Authorization': `Bearer ${accessToken}`,
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
