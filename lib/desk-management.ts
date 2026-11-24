import { api } from "@/lib/api";

export type RecordStatus = "ACTIVE" | "INACTIVE";
export type DeskBookingStatus = "BOOKED" | "CANCELLED";

export interface Desk {
  id: string;
  name: string;
  code: string;
  locationId: string | null;
  locationName: string | null;
  status: RecordStatus;
  bookedBy: { id: string; name: string; bookingId: string } | null;
}

export interface DeskBooking {
  id: string;
  deskId: string;
  deskName: string;
  deskCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  status: DeskBookingStatus;
  notes: string | null;
}

export interface MyDeskBooking {
  id: string;
  deskId: string;
  deskName: string;
  deskCode: string;
  date: string;
  notes: string | null;
}

export interface DeskInput {
  name: string;
  code: string;
  locationId?: string | null;
  status?: RecordStatus;
}

export async function listDesks(params?: { locationId?: string; date?: string }): Promise<Desk[]> {
  const query = new URLSearchParams();
  if (params?.locationId) query.set("locationId", params.locationId);
  if (params?.date) query.set("date", params.date);
  const qs = query.toString();
  const result = await api.get<{ desks: Desk[] }>(`/desk-management${qs ? `?${qs}` : ""}`);
  return result.desks;
}

export async function createDesk(input: DeskInput): Promise<Desk> {
  const result = await api.post<{ desk: Desk }>("/desk-management", input);
  return result.desk;
}

export async function updateDesk(id: string, input: Partial<DeskInput>): Promise<Desk> {
  const result = await api.patch<{ desk: Desk }>(`/desk-management/${id}`, input);
  return result.desk;
}

export async function deleteDesk(id: string): Promise<void> {
  await api.del(`/desk-management/${id}`);
}

export async function listBookings(params?: { date?: string; deskId?: string }): Promise<DeskBooking[]> {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  if (params?.deskId) query.set("deskId", params.deskId);
  const qs = query.toString();
  const result = await api.get<{ bookings: DeskBooking[] }>(`/desk-management/bookings${qs ? `?${qs}` : ""}`);
  return result.bookings;
}

export async function getMyBookings(): Promise<MyDeskBooking[]> {
  const result = await api.get<{ bookings: MyDeskBooking[] }>("/desk-management/mine");
  return result.bookings;
}

export async function bookDesk(deskId: string, input: { date: string; notes?: string | null }): Promise<DeskBooking> {
  const result = await api.post<{ booking: DeskBooking }>(`/desk-management/${deskId}/book`, input);
  return result.booking;
}

export async function cancelBooking(bookingId: string): Promise<void> {
  await api.del(`/desk-management/bookings/${bookingId}`);
}
