"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { getReportSummary, type ReportSummary } from "@/lib/reports";
import { useToast } from "@/components/ui/Toast";

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function downloadCsv(data: ReportSummary) {
  const rows: (string | number)[][] = [
    ["Report", "Metric", "Value", "Period"],
    ["Headcount", "Active", data.headcount.active, data.year],
    ["Headcount", "Inactive", data.headcount.inactive, data.year],
    ["Headcount", "Suspended", data.headcount.suspended, data.year],
    ...data.headcount.byDepartment.map((row) => ["Department headcount", row.department, row.employees, data.year]),
    ...data.timeOff.map((row) => [`Time off · ${row.type}`, row.status, row.requestCount, data.year]),
    ["Payslips", "Uploaded", data.payslips.uploaded, data.period],
    ["Payslips", "Missing for active employees", data.payslips.missing, data.period],
  ];
  const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `hrms-reports-${data.year}-${data.period}.csv`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ReportsPage() {
  const toast = useToast();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [period, setPeriod] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    getReportSummary(year, period)
      .then((result) => {
        if (active) {
          setData(result);
          setError(null);
        }
      })
      .catch((cause) => {
        if (active) {
          setData(null);
          setError(cause instanceof Error ? cause.message : "Could not load reports");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [year, period, retry]);

  const exportReport = () => {
    if (!data) return;
    downloadCsv(data);
    toast.success("Report exported as CSV");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle="Live headcount, time-off, and payslip distribution"
        actions={
          <button type="button" onClick={exportReport} disabled={!data} className="btn-primary inline-flex items-center gap-2 px-3.5 py-2 text-sm disabled:opacity-50">
            <Icon name="Download" size={15} /> Export CSV
          </button>
        }
      />
      <div className="card flex flex-wrap items-end gap-4 p-4">
        <label className="text-xs font-medium text-[var(--text-muted)]">
          Time-off year
          <select className="input-base mt-1 block min-w-36" value={year} onChange={(event) => { setLoading(true); setError(null); setYear(Number(event.target.value)); }}>
            {[0, 1, 2, 3].map((offset) => {
              const optionYear = today.getFullYear() - offset;
              return <option key={optionYear} value={optionYear}>{optionYear}</option>;
            })}
          </select>
        </label>
        <label className="text-xs font-medium text-[var(--text-muted)]">
          Payslip month
          <input className="input-base mt-1 block" type="month" value={period} onChange={(event) => { setLoading(true); setError(null); setPeriod(event.target.value); }} />
        </label>
        {data && <span className="ml-auto text-xs text-[var(--text-subtle)]">Updated {new Date(data.generatedAt).toLocaleString()}</span>}
      </div>

      {error ? (
        <div className="card p-8 text-center">
          <p className="font-medium text-[var(--text)]">Reports could not be loaded</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); setRetry((value) => value + 1); }} className="btn-primary mt-4 px-4 py-2 text-sm">Try again</button>
        </div>
      ) : loading || !data ? (
        <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading live report data…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Active employees", value: data.headcount.active, icon: "Users" },
              { label: "Time-off requests", value: data.timeOff.reduce((sum, row) => sum + row.requestCount, 0), icon: "CalendarDays" },
              { label: `Payslips uploaded · ${data.period}`, value: `${data.payslips.uploaded} / ${data.payslips.activeEmployees}`, icon: "Wallet" },
            ].map((card) => (
              <div key={card.label} className="card flex items-center gap-3 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-50)] text-[var(--brand-700)]"><Icon name={card.icon} size={19} /></span>
                <div><p className="text-xs text-[var(--text-muted)]">{card.label}</p><p className="text-xl font-semibold text-[var(--text)]">{card.value}</p></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className="card p-5">
              <h2 className="mb-4 font-semibold text-[var(--text)]">Headcount by department</h2>
              {data.headcount.byDepartment.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-subtle)]"><th className="pb-2">Department</th><th className="pb-2 text-right">Employees</th></tr></thead>
                    <tbody>{data.headcount.byDepartment.map((row) => <tr key={row.departmentId} className="border-b border-[var(--border)] last:border-0"><td className="py-3 text-[var(--text)]">{row.department}</td><td className="py-3 text-right font-medium text-[var(--text)]">{row.employees}</td></tr>)}</tbody>
                  </table>
                </div>
              ) : <p className="py-8 text-center text-sm text-[var(--text-muted)]">No department records.</p>}
              <p className="mt-4 border-t border-[var(--border)] pt-3 text-xs text-[var(--text-muted)]">
                {data.headcount.active} active · {data.headcount.inactive} inactive · {data.headcount.suspended} suspended
              </p>
            </section>

            <section className="card p-5">
              <h2 className="mb-4 font-semibold text-[var(--text)]">Time-off requests · {data.year}</h2>
              {data.timeOff.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-subtle)]"><th className="pb-2">Type</th><th className="pb-2">Status</th><th className="pb-2 text-right">Requests</th><th className="pb-2 text-right">Days / hours</th></tr></thead>
                    <tbody>{data.timeOff.map((row) => <tr key={`${row.type}-${row.status}`} className="border-b border-[var(--border)] last:border-0"><td className="py-3 text-[var(--text)]">{row.type.replaceAll("_", " ")}</td><td className="py-3 text-[var(--text-muted)]">{row.status.toLowerCase()}</td><td className="py-3 text-right text-[var(--text)]">{row.requestCount}</td><td className="py-3 text-right text-[var(--text)]">{row.type === "EXTRA_HOURS" ? `${row.extraHours} h` : `${row.leaveDays} d`}</td></tr>)}</tbody>
                  </table>
                </div>
              ) : <p className="py-8 text-center text-sm text-[var(--text-muted)]">No time-off requests were created in this year.</p>}
            </section>

            <section className="card p-5 lg:col-span-2">
              <h2 className="mb-4 font-semibold text-[var(--text)]">Payslip distribution</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-[var(--surface-2)] p-4"><p className="text-xs text-[var(--text-muted)]">Active employees</p><p className="mt-1 text-xl font-semibold">{data.payslips.activeEmployees}</p></div>
                <div className="rounded-lg bg-[var(--surface-2)] p-4"><p className="text-xs text-[var(--text-muted)]">Uploaded for {data.period}</p><p className="mt-1 text-xl font-semibold">{data.payslips.uploaded}</p></div>
                <div className="rounded-lg bg-[var(--surface-2)] p-4"><p className="text-xs text-[var(--text-muted)]">Not uploaded</p><p className="mt-1 text-xl font-semibold">{data.payslips.missing}</p></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                {data.payslips.byMonth.map((row) => <span key={row.period} className="badge badge-muted">{row.period}: {row.uploaded} uploaded</span>)}
                {!data.payslips.byMonth.length && <p className="text-sm text-[var(--text-muted)]">No payslips were uploaded in {data.year}.</p>}
              </div>
            </section>
          </div>
          <p className="text-xs text-[var(--text-subtle)]">Attendance and performance reports are unavailable until their data sources are integrated.</p>
        </>
      )}
    </div>
  );
}
