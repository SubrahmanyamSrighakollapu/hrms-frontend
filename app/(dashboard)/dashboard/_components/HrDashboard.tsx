import { DashboardView } from "./DashboardView";
import type { DashboardSummary } from "@/lib/dashboard";

export function HrDashboard({ data }: { data: DashboardSummary }) {
  return <DashboardView data={data} />;
}
