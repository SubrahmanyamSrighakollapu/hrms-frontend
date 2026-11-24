import { api } from '@/lib/api';

export type RecordStatus = "ACTIVE" | "INACTIVE";
export type SubLocationType = "BLOCK" | "FLOOR" | "WING" | "ZONE" | "OTHER";

export const SUB_LOCATION_TYPES: SubLocationType[] = ["BLOCK", "FLOOR", "WING", "ZONE", "OTHER"];
export const SUB_LOCATION_TYPE_LABEL: Record<SubLocationType, string> = {
  BLOCK: "Block",
  FLOOR: "Floor",
  WING: "Wing",
  ZONE: "Zone",
  OTHER: "Other",
};

export interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: RecordStatus;
  headId: string | null;
  headName: string | null;
  parentId: string | null;
  parentName: string | null;
  locationId: string | null;
  locationName: string | null;
  employeeCount: number;
  childCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentInput {
  name: string;
  code: string | null;
  description: string | null;
  headId?: string | null;
  parentId?: string | null;
  locationId?: string | null;
  status?: RecordStatus;
}

export interface OrganizationEmployee {
  id: string;
  employeeCode: string | null;
  name: string;
  email: string;
  designation: string | null;
  departmentId: string | null;
  department: string | null;
  managerId: string | null;
}

export interface Location {
  id: string;
  name: string;
  code: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  timezone: string;
  workStart: string | null;
  workEnd: string | null;
  isDefault: boolean;
  status: RecordStatus;
  employeeCount: number;
  departmentCount: number;
  subLocationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocationInput {
  name: string;
  code?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  timezone?: string;
  workStart?: string | null;
  workEnd?: string | null;
  isDefault?: boolean;
  status?: RecordStatus;
}

export interface SubLocation {
  id: string;
  locationId: string;
  locationName: string;
  name: string;
  type: SubLocationType;
  code: string | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SubLocationInput {
  locationId: string;
  name: string;
  type?: SubLocationType;
  code?: string | null;
  status?: RecordStatus;
}

/* ----------------------------- Departments ----------------------------- */

export async function listDepartments() {
  const result = await api.get<{ departments: Department[] }>('/organization/departments');
  return result.departments;
}

export async function listOrganizationEmployees() {
  const result = await api.get<{ employees: OrganizationEmployee[] }>('/organization/hierarchy');
  return result.employees;
}

export async function createDepartment(input: DepartmentInput) {
  return api.post<{ department: Department }>('/organization/departments', input);
}

export async function updateDepartment(id: string, input: Partial<DepartmentInput>) {
  return api.patch<{ department: Department }>(`/organization/departments/${id}`, input);
}

export function deleteDepartment(id: string) {
  return api.del<{ id: string }>(`/organization/departments/${id}`);
}

/* ------------------------------- Locations ------------------------------ */

export async function listLocations() {
  const result = await api.get<{ locations: Location[] }>('/organization/locations');
  return result.locations;
}

export async function createLocation(input: LocationInput) {
  return api.post<{ location: Location }>('/organization/locations', input);
}

export async function updateLocation(id: string, input: Partial<LocationInput>) {
  return api.patch<{ location: Location }>(`/organization/locations/${id}`, input);
}

export function deleteLocation(id: string) {
  return api.del<{ id: string }>(`/organization/locations/${id}`);
}

/* ----------------------------- Sub-locations ---------------------------- */

export async function listSubLocations(locationId?: string) {
  const qs = locationId ? `?locationId=${encodeURIComponent(locationId)}` : '';
  const result = await api.get<{ subLocations: SubLocation[] }>(`/organization/sub-locations${qs}`);
  return result.subLocations;
}

export async function createSubLocation(input: SubLocationInput) {
  return api.post<{ subLocation: SubLocation }>('/organization/sub-locations', input);
}

export async function updateSubLocation(id: string, input: Partial<SubLocationInput>) {
  return api.patch<{ subLocation: SubLocation }>(`/organization/sub-locations/${id}`, input);
}

export function deleteSubLocation(id: string) {
  return api.del<{ id: string }>(`/organization/sub-locations/${id}`);
}
