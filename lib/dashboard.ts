import { api } from '@/lib/api';

export interface DashboardSummary {
  generatedAt: string;
  viewer: { firstName: string; lastName: string; roleName: string };
  employees: { total: number; active: number; inactive: number; suspended: number } | null;
  departments: { id: string; name: string; activeEmployees: number }[];
  recentEmployees: {
    id: string;
    name: string;
    designation: string | null;
    department: string | null;
    joinedAt: string | null;
  }[];
  newJoinerCount: number | null;
  pendingApprovals: {
    total: number;
    requests: {
      id: string;
      employeeName: string;
      type: string;
      leaveType: string | null;
      days: number | null;
      fromDate: string | null;
      toDate: string | null;
      createdAt: string;
    }[];
  } | null;
  approvedLeaveToday: number | null;
  leaveBalances: { leaveType: string; total: number; used: number; remaining: number }[];
  recentRequests: {
    id: string;
    type: string;
    status: string;
    leaveType: string | null;
    fromDate: string | null;
    toDate: string | null;
    requestDate: string;
    createdAt: string;
  }[];
  currentPeriod: string;
  currentPeriodPayslips: number | null;
}

export function getDashboardSummary() {
  return api.get<DashboardSummary>('/dashboard/summary');
}
