import { api } from "@/lib/api";

export type HolidayType = "PUBLIC" | "OPTIONAL";
export type RecordStatus = "ACTIVE" | "INACTIVE";

export interface Holiday {
  id: string;
  name: string;
  date: string; // ISO date
  type: HolidayType;
  year: number;
  description: string | null;
  locationId: string | null;
  locationName: string | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HolidayInput {
  name: string;
  date: string;
  type?: HolidayType;
  year?: number;
  description?: string | null;
  locationId?: string | null;
  status?: RecordStatus;
}

export interface HolidaySettings {
  optionalHolidayAllowance: number;
}

export interface HolidayAvail {
  id: string;
  holidayId: string;
  year: number;
  createdAt: string;
  holiday: {
    id: string;
    name: string;
    date: string;
    type: HolidayType;
    description: string | null;
  };
}

export interface MyAvails {
  optionalHolidayAllowance: number;
  used: number;
  remaining: number;
  avails: HolidayAvail[];
}

export interface TeamAvail {
  id: string;
  holidayId: string;
  year: number;
  createdAt: string;
  employee: { id: string; name: string; email: string };
  holiday: { id: string; name: string; date: string; type: HolidayType };
}

export interface TeamAvails {
  reports: { id: string; name: string; email: string }[];
  avails: TeamAvail[];
}

export async function listHolidays(params?: { year?: number; type?: HolidayType }) {
  const query = new URLSearchParams();
  if (params?.year) query.set("year", String(params.year));
  if (params?.type) query.set("type", params.type);
  const qs = query.toString();
  const result = await api.get<{ holidays: Holiday[] }>(`/holidays${qs ? `?${qs}` : ""}`);
  return result.holidays;
}

export async function getHolidaySettings(): Promise<HolidaySettings> {
  const result = await api.get<{ settings: HolidaySettings }>("/holidays/settings");
  return result.settings;
}

export async function updateHolidaySettings(input: HolidaySettings): Promise<HolidaySettings> {
  const result = await api.put<{ settings: HolidaySettings }>("/holidays/settings", input);
  return result.settings;
}

export async function createHoliday(input: HolidayInput): Promise<Holiday> {
  const result = await api.post<{ holiday: Holiday }>("/holidays", input);
  return result.holiday;
}

export async function updateHoliday(id: string, input: Partial<HolidayInput>): Promise<Holiday> {
  const result = await api.patch<{ holiday: Holiday }>(`/holidays/${id}`, input);
  return result.holiday;
}

export async function deleteHoliday(id: string): Promise<void> {
  await api.del(`/holidays/${id}`);
}

export async function getMyAvails(year?: number): Promise<MyAvails> {
  const qs = year ? `?year=${year}` : "";
  return api.get<MyAvails>(`/holidays/mine${qs}`);
}

export async function availHoliday(id: string): Promise<unknown> {
  return api.post(`/holidays/${id}/avail`, {});
}

export async function cancelAvail(id: string): Promise<void> {
  await api.del(`/holidays/${id}/avail`);
}

export async function getTeamAvails(year?: number): Promise<TeamAvails> {
  const qs = year ? `?year=${year}` : "";
  return api.get<TeamAvails>(`/holidays/team${qs}`);
}
