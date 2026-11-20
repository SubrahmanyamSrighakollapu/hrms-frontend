import { api } from '@/lib/api';

export interface ReportSummary {
  year: number;
  period: string;
  generatedAt: string;
  headcount: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    byDepartment: { departmentId: string; department: string; employees: number }[];
  };
  timeOff: {
    type: string;
    status: string;
    requestCount: number;
    leaveDays: number;
    extraHours: number;
  }[];
  payslips: {
    period: string;
    activeEmployees: number;
    uploaded: number;
    missing: number;
    byMonth: { period: string; uploaded: number }[];
  };
}

export function getReportSummary(year: number, period: string) {
  const params = new URLSearchParams({ year: String(year), period });
  return api.get<ReportSummary>(`/reports/summary?${params.toString()}`);
}
