import { api } from "@/lib/api";

export type CalendarEventType = "BIRTHDAY" | "ANNIVERSARY" | "NEW_JOINEE" | "HOLIDAY";
export type HolidayType = "PUBLIC" | "OPTIONAL";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string; // YYYY-MM-DD
  // Person-based event details
  employeeId?: string;
  employeeName?: string;
  employeeCode?: string;
  designation?: string | null;
  // Holiday details
  holidayType?: HolidayType;
  // Anniversary detail
  years?: number;
}

export async function getCalendarEvents(params: { start: string; end: string }): Promise<CalendarEvent[]> {
  const query = new URLSearchParams({ start: params.start, end: params.end });
  const result = await api.get<{ events: CalendarEvent[] }>(`/calendars/events?${query.toString()}`);
  return result.events;
}
