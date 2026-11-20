import { api } from '@/lib/api';

export interface OrganizationProfile {
  id: string;
  name: string;
  supportEmail: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export type LeaveType = 'CASUAL' | 'SICK' | 'EARNED' | 'COMP_OFF' | 'PERSONAL' | 'UNPAID';

export interface ManagedLeaveBalance {
  id: string;
  employeeId: string;
  employeeCode: string | null;
  employeeName: string;
  email: string;
  department: string | null;
  leaveType: LeaveType;
  year: number;
  total: number;
  used: number;
  remaining: number;
}

export function getOrganizationProfile() {
  return api.get<{ profile: OrganizationProfile }>('/settings/profile');
}

export function updateOrganizationProfile(input: {
  name: string;
  supportEmail: string | null;
  timezone: string;
}) {
  return api.patch<{ profile: OrganizationProfile }>('/settings/profile', input);
}

export async function listManagedLeaveBalances(year: number) {
  const result = await api.get<{ balances: ManagedLeaveBalance[] }>(`/settings/leave-balances?year=${year}`);
  return result.balances;
}

export function setManagedLeaveBalance(input: {
  employeeId: string;
  leaveType: LeaveType;
  year: number;
  total: number;
}) {
  return api.put<{ balance: Omit<ManagedLeaveBalance, 'employeeName' | 'employeeCode' | 'email' | 'department'> }>(
    '/settings/leave-balances',
    input,
  );
}
