"use client";

import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";

const PAYSLIPS = [
  { id: 1, month: "October 2026", period: "01 Oct – 31 Oct", status: "Paid", net: "₹85,400", uploaded: "Nov 01, 2026" },
  { id: 2, month: "September 2026", period: "01 Sep – 30 Sep", status: "Paid", net: "₹82,100", uploaded: "Oct 01, 2026" },
  { id: 3, month: "August 2026", period: "01 Aug – 31 Aug", status: "Paid", net: "₹82,100", uploaded: "Sep 01, 2026" },
  { id: 4, month: "July 2026", period: "01 Jul – 31 Jul", status: "Paid", net: "₹79,800", uploaded: "Aug 01, 2026" },
];

export default function PayrollPage() {
  const { can } = useAuth();
  const isHr = can("payroll", "MANAGE");

  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle={isHr ? "Upload and manage employee payslips" : "View and download your payslips"}
        actions={
          isHr && (
            <button className="btn-primary px-3.5 py-2 rounded-lg flex items-center gap-2 text-sm">
              <Icon name="Plus" size={15} /> Upload Payslip
            </button>
          )
        }
      />

      {isHr ? (
        <div className="space-y-5">
          {/* Upload dropzone */}
          <div className="card p-8 border-dashed border-2 flex flex-col items-center justify-center text-center" style={{ borderColor: "var(--brand-300)", background: "var(--brand-50)" }}>
            <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center mb-3" style={{ boxShadow: "var(--shadow-sm)" }}>
              <Icon name="Download" size={26} className="text-[var(--brand-700)]" />
            </div>
            <h3 className="font-semibold text-[var(--text)]">Upload Monthly Payslips</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1 max-w-md">Drag & drop payslip PDFs here, or click to browse. Files are organized by employee and month automatically.</p>
            <button className="btn-primary mt-4 px-5 py-2 rounded-lg text-sm flex items-center gap-2">
              <Icon name="Plus" size={15} /> Browse Files
            </button>
            <p className="text-xs text-[var(--text-subtle)] mt-3">Supported: PDF · Max 10MB per file</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { l: "Total Employees", v: "248", i: "Users", c: "var(--brand-50)" },
              { l: "Uploaded (Oct)", v: "231", i: "Check", c: "var(--success-bg)" },
              { l: "Pending", v: "17", i: "Clock3", c: "var(--warning-bg)" },
              { l: "Total Payout", v: "₹1.24Cr", i: "Wallet", c: "var(--info-bg)" },
            ].map((s) => (
              <div key={s.l} className="card p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: s.c }}>
                  <Icon name={s.i} size={19} className="text-[var(--brand-700)]" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)]">{s.l}</div>
                  <div className="text-xl font-bold text-[var(--text)]">{s.v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Payslip table (both roles see it) */}
      <div className="card mt-5 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="font-semibold text-[var(--text)]">{isHr ? "Recent Uploads" : "My Payslips"}</h3>
          <div className="relative">
            <Icon name="Search" size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
            <input placeholder="Search payslips..." className="input-base py-1.5 pl-8 text-sm w-56" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--slate-50)]">
              <tr className="text-left text-xs text-[var(--text-muted)]">
                {isHr && <th className="px-4 py-3 font-medium">Employee</th>}
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Pay Period</th>
                <th className="px-4 py-3 font-medium">Net Pay</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Uploaded</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {PAYSLIPS.map((p) => (
                <tr key={p.id} className="border-t border-[var(--border)] hover:bg-[var(--slate-50)]">
                  {isHr && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] text-xs font-bold flex items-center justify-center">RV</div>
                        <span className="font-medium text-[var(--text)]">Rahul Verma</span>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium text-[var(--text)]">{p.month}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{p.period}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--text)]">{p.net}</td>
                  <td className="px-4 py-3"><span className="badge badge-success">{p.status}</span></td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{p.uploaded}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn-ghost px-3 py-1.5 rounded-md text-xs font-semibold text-[var(--brand-600)] hover:bg-[var(--brand-50)] inline-flex items-center gap-1.5">
                      <Icon name="Download" size={14} /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
