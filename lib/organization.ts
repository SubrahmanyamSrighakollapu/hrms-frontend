import { api } from '@/lib/api';

export interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
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

export interface DepartmentInput {
  name: string;
  code: string | null;
  description: string | null;
}

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
