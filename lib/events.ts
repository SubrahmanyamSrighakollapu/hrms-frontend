import { api } from "@/lib/api";

export type RecordStatus = "ACTIVE" | "INACTIVE";
export type RSVPResponse = "GOING" | "INTERESTED" | "NOT_GOING";

export interface RSVPSummary {
  going: number;
  interested: number;
  notGoing: number;
  total: number;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string; // ISO
  endDate: string | null;
  location: string | null;
  category: string | null;
  status: RecordStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  rsvpSummary: RSVPSummary;
  myRsvp: RSVPResponse | null;
}

export interface EventDetail extends Event {
  rsvps: {
    id: string;
    userId: string;
    response: RSVPResponse;
    user: { id: string; name: string; email: string };
  }[];
}

export interface MyRSVP {
  id: string;
  eventId: string;
  response: RSVPResponse;
  createdAt: string;
  updatedAt: string;
  event: {
    id: string;
    title: string;
    date: string;
    endDate: string | null;
    location: string | null;
    category: string | null;
    status: RecordStatus;
  };
}

export interface EventInput {
  title: string;
  description?: string | null;
  date: string;
  endDate?: string | null;
  location?: string | null;
  category?: string | null;
  status?: RecordStatus;
}

export async function listEvents(params?: { upcoming?: boolean }): Promise<Event[]> {
  const query = new URLSearchParams();
  if (params?.upcoming) query.set("upcoming", "true");
  const qs = query.toString();
  const result = await api.get<{ events: Event[] }>(`/events${qs ? `?${qs}` : ""}`);
  return result.events;
}

export async function getEvent(id: string): Promise<EventDetail> {
  const result = await api.get<{ event: EventDetail }>(`/events/${id}`);
  return result.event;
}

export async function createEvent(input: EventInput): Promise<Event> {
  const result = await api.post<{ event: Event }>("/events", input);
  return result.event;
}

export async function updateEvent(id: string, input: Partial<EventInput>): Promise<Event> {
  const result = await api.patch<{ event: Event }>(`/events/${id}`, input);
  return result.event;
}

export async function deleteEvent(id: string): Promise<void> {
  await api.del(`/events/${id}`);
}

export async function rsvpToEvent(eventId: string, response: RSVPResponse): Promise<{ id: string; eventId: string; userId: string; response: RSVPResponse }> {
  const result = await api.post<{ rsvp: { id: string; eventId: string; userId: string; response: RSVPResponse } }>(`/events/${eventId}/rsvp`, { response });
  return result.rsvp;
}

export async function getMyRsvps(): Promise<MyRSVP[]> {
  const result = await api.get<{ rsvps: MyRSVP[] }>("/events/mine");
  return result.rsvps;
}
