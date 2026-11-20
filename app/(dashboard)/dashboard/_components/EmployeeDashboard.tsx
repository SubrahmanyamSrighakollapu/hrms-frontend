import { DashboardView } from "./DashboardView";
import type { DashboardSummary } from "@/lib/dashboard";

export function EmployeeDashboard({ data }: { data: DashboardSummary }) {
  return <DashboardView data={data} />;
}
