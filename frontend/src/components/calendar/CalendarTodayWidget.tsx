import { getTodayEvents, getCalendarConnection, getValidAccessToken } from "@/lib/calendar/service";
import { Calendar as CalendarIcon, Clock, Settings, RefreshCw } from "lucide-react";
import { Suspense } from "react";
import { RelationshipService } from "@/lib/relationships/service";

async function CalendarEventsList({ userId, localDateStr }: { userId: string, localDateStr: string }) {
  const connection = await getCalendarConnection(userId);
  
  if (!connection) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center text-[hsl(var(--ink-muted))]">
        <CalendarIcon className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">Google Calendar not connected</p>
        <a 
          href="/api/calendar/connect" 
          className="mt-3 px-4 py-2 text-xs font-semibold bg-[hsl(var(--primary))] text-white rounded-md hover:opacity-90"
        >
          Connect Calendar
        </a>
      </div>
    );
  }

  const validToken = await getValidAccessToken(connection);
  if (!validToken) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center text-[hsl(var(--ink-muted))]">
        <CalendarIcon className="w-8 h-8 mb-2 opacity-60 text-amber-500" />
        <p className="text-sm font-medium text-[hsl(var(--ink))]">Calendar session expired</p>
        <p className="text-xs text-[hsl(var(--ink-secondary))] mt-0.5 max-w-[220px]">
          Google token has expired. Please reconnect to sync today's events.
        </p>
        <a 
          href="/api/calendar/connect" 
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[hsl(var(--primary))] text-white rounded-md hover:opacity-90 shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reconnect
        </a>
      </div>
    );
  }

  const events = await getTodayEvents(userId, localDateStr);

  if (events.length === 0) {
    return (
      <div className="py-6 text-center text-[hsl(var(--ink-muted))]">
        <p className="text-sm">No events scheduled for today</p>
      </div>
    );
  }

  // Fetch relationships for events
  const eventsWithRelations = await Promise.all(events.map(async (event) => {
    const related = await RelationshipService.getRelatedObjects(userId, 'calendar', event.id);
    return { ...event, related };
  }));

  return (
    <div className="space-y-3">
      {eventsWithRelations.map((event) => (
        <a 
          key={event.id}
          href={event.htmlLink}
          target="_blank"
          rel="noopener noreferrer" 
          className="flex flex-col p-3 bg-[hsl(var(--surface-elevated))] rounded-lg border border-[hsl(var(--hairline))] group hover:border-[hsl(var(--ink-tertiary))] transition-colors"
        >
          <div className="flex justify-between items-start mb-1">
            <span className="text-sm font-semibold group-hover:text-[hsl(var(--primary))] transition-colors">{event.summary}</span>
            {event.isAllDay ? (
              <span className="text-[10px] font-semibold tracking-wider text-[hsl(var(--ink-muted))] bg-[hsl(var(--surface))] px-2 py-0.5 rounded-full">ALL DAY</span>
            ) : (
              <span className="text-xs text-[hsl(var(--ink-secondary))] font-medium">
                {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          {event.location && (
            <p className="text-xs text-[hsl(var(--ink-muted))] truncate">{event.location}</p>
          )}
          {event.related && event.related.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[hsl(var(--hairline))] flex flex-wrap gap-2">
              {event.related.map((rel: any) => (
                <div key={`${rel._type}-${rel.id}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[hsl(var(--canvas))] rounded text-[10px] font-medium text-[hsl(var(--ink-secondary))]">
                  Related: {rel.title}
                </div>
              ))}
            </div>
          )}
        </a>
      ))}
    </div>
  );
}

export function CalendarTodayWidget({ userId, localDateStr }: { userId: string, localDateStr: string }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider">CALENDAR</h2>
        <a href="/settings" className="text-xs font-medium text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--primary))]"><Settings className="w-4 h-4" /></a>
      </div>
      <div className="min-h-[120px] rounded-lg border border-[hsl(var(--hairline))] p-4 bg-[hsl(var(--surface))]">
        <Suspense fallback={<div className="flex justify-center py-6 text-[hsl(var(--ink-muted))]"><Clock className="w-5 h-5 animate-pulse opacity-50" /></div>}>
          <CalendarEventsList userId={userId} localDateStr={localDateStr} />
        </Suspense>
      </div>
    </section>
  );
}
