"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { TablePagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import {
  downloadPayslip,
  listPayslips,
  uploadPayslips,
  type Payslip,
  type PayslipBatchResult,
} from "@/lib/payroll";

const MAX_BATCH_FILES = 100;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export default function PayrollPage() {
  const { can, loading: authLoading } = useAuth();
  const toast = useToast();
  const isHr = can("payroll", "MANAGE");
  const canView = can("payroll");
  const fileInput = useRef<HTMLInputElement>(null);
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [payrollPeriod, setPayrollPeriod] = useState(currentPeriod);
  const [periodFilter, setPeriodFilter] = useState("");
  const [search, setSearch] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [batchResult, setBatchResult] = useState<PayslipBatchResult | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchList = useCallback(
    () =>
      listPayslips({
        payrollPeriod: periodFilter || undefined,
        q: isHr ? search.trim() || undefined : undefined,
        page,
        pageSize: 50,
      }),
    [isHr, page, periodFilter, search],
  );

  useEffect(() => {
    if (authLoading || !canView) return;
    let active = true;
    fetchList()
      .then((result) => {
        if (!active) return;
        setPayslips(result.payslips);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load payslips.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, canView, fetchList]);

  const refreshList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchList();
      setPayslips(result.payslips);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load payslips.");
    } finally {
      setLoading(false);
    }
  }, [fetchList]);

  const acceptFiles = (selected: FileList | File[]) => {
    const selectedFiles = Array.from(selected);
    const pdfs = selectedFiles.filter((file) => file.name.toLowerCase().endsWith(".pdf"));
    const withinSizeLimit = pdfs.filter((file) => file.size <= MAX_FILE_BYTES);
    if (pdfs.length !== selectedFiles.length) toast.error("Only PDF files can be added.");
    if (withinSizeLimit.length !== pdfs.length) toast.error("Each PDF must be 10 MB or smaller.");
    const capacity = Math.max(0, MAX_BATCH_FILES - files.length);
    if (withinSizeLimit.length > capacity) toast.error("A batch can contain up to 100 files.");
    const accepted = withinSizeLimit.slice(0, capacity);
    if (accepted.length) {
      setFiles((current) => [...current, ...accepted]);
      setBatchResult(null);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) acceptFiles(event.target.files);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFiles(event.dataTransfer.files);
  };

  const submitUpload = async () => {
    if (!files.length || uploading) return;
    setUploading(true);
    setBatchResult(null);
    try {
      const result = await uploadPayslips(payrollPeriod, files);
      setBatchResult(result);
      setFiles([]);
      toast.success(`${result.uploaded} payslip${result.uploaded === 1 ? "" : "s"} uploaded; ${result.rejected} rejected.`);
      await refreshList();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not upload the payslips.");
    } finally {
      setUploading(false);
    }
  };

  const download = async (payslip: Payslip) => {
    if (downloading) return;
    setDownloading(payslip.id);
    try {
      const blob = await downloadPayslip(payslip.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = payslip.originalFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not download this payslip.");
    } finally {
      setDownloading(null);
    }
  };

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const onPeriodFilterChange = (value: string) => {
    setPeriodFilter(value);
    setPage(1);
  };

  const formatPeriod = (period: string) =>
    new Date(`${period}-01T00:00:00.000Z`).toLocaleDateString("en", { month: "long", year: "numeric", timeZone: "UTC" });

  const formatFileSize = (size: number) =>
    size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle={isHr ? "Upload payroll PDFs in bulk and review employee payslips" : "View and download your payslips"}
      />

      {isHr && (
        <section className="card mb-5 p-5 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-semibold text-[var(--text)]">Bulk payslip upload</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Choose a payroll month. Each PDF must be named with its employee code, such as EMP-0001.pdf.
              </p>
            </div>
            <label className="w-full text-xs font-medium text-[var(--text-muted)] sm:w-48">
              Payroll month
              <input
                type="month"
                value={payrollPeriod}
                onChange={(event) => setPayrollPeriod(event.target.value)}
                className="input-base mt-1 py-2 text-sm"
              />
            </label>
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              dragging ? "border-[var(--brand-500)] bg-[var(--brand-50)]" : "border-[var(--border-strong)] bg-[var(--surface-2)]"
            }`}
          >
            <input ref={fileInput} type="file" accept=".pdf,application/pdf" multiple onChange={onFileChange} className="hidden" />
            <Icon name="Upload" size={24} className="mx-auto text-[var(--brand-700)]" />
            <p className="mt-2 text-sm font-medium text-[var(--text)]">Drop employee payslip PDFs here</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Up to 100 files per batch, 10 MB per file</p>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="btn-ghost mt-3 inline-flex items-center gap-2 px-3.5 py-2 text-sm"
            >
              <Icon name="File" size={15} /> Browse PDFs
            </button>
          </div>

          {files.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--text-muted)]">
                <Icon name="FileText" size={16} />
                <span className="truncate">{files.length} file{files.length === 1 ? "" : "s"} selected</span>
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  className="btn-subtle px-2 py-1 text-xs"
                  aria-label="Clear selected files"
                >
                  Clear
                </button>
              </div>
              <button
                type="button"
                onClick={() => void submitUpload()}
                disabled={uploading || !payrollPeriod}
                className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon name={uploading ? "LoaderCircle" : "Upload"} size={15} className={uploading ? "animate-spin" : ""} />
                {uploading ? "Uploading..." : "Upload batch"}
              </button>
            </div>
          )}

          {batchResult && (
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <p className="text-sm font-semibold text-[var(--text)]">
                {batchResult.uploaded} uploaded, {batchResult.rejected} rejected for {formatPeriod(batchResult.payrollPeriod)}
              </p>
              {batchResult.results.some((result) => result.status === "REJECTED") && (
                <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-[var(--danger)]">
                  {batchResult.results.filter((result) => result.status === "REJECTED").map((result, index) => (
                    <li key={`${result.filename}-${index}`}>{result.filename}: {result.reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      {!canView && !authLoading && (
        <div className="card p-8 text-center text-sm text-[var(--text-muted)]">
          You do not have permission to view payroll.
        </div>
      )}

      {canView && (
        <section className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-[var(--text)]">{isHr ? "Payslip records" : "My payslips"}</h3>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{total} record{total === 1 ? "" : "s"}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="payroll-month-filter">Filter by month</label>
              <input
                id="payroll-month-filter"
                type="month"
                value={periodFilter}
                onChange={(event) => onPeriodFilterChange(event.target.value)}
                className="input-base py-1.5 text-sm sm:w-40"
              />
              {isHr && (
                <div className="relative sm:w-56">
                  <Icon name="Search" size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
                  <input
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Search employee..."
                    className="input-base input-base--leading-icon py-1.5 text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {error && <p role="alert" className="px-4 py-3 text-sm text-[var(--danger)]">{error}</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--slate-50)]">
                <tr className="text-left text-xs text-[var(--text-muted)]">
                  {isHr && <th className="px-4 py-3 font-medium">Employee</th>}
                  <th className="px-4 py-3 font-medium">Payroll month</th>
                  <th className="px-4 py-3 font-medium">PDF</th>
                  <th className="px-4 py-3 font-medium">Uploaded</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isHr ? 5 : 4} className="px-4 py-10 text-center text-[var(--text-muted)]">Loading payslips...</td></tr>
                ) : payslips.length === 0 ? (
                  <tr><td colSpan={isHr ? 5 : 4} className="px-4 py-10 text-center text-[var(--text-muted)]">No payslips found for this period.</td></tr>
                ) : payslips.map((payslip) => (
                  <tr key={payslip.id} className="border-t border-[var(--border)] hover:bg-[var(--slate-50)]">
                    {isHr && (
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--text)]">{payslip.employeeName}</div>
                        <div className="text-xs text-[var(--text-muted)]">{payslip.employeeCode ?? payslip.employeeEmail}</div>
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{formatPeriod(payslip.payrollPeriod)}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-1.5"><Icon name="FileText" size={14} /> PDF · {formatFileSize(payslip.fileSize)}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {new Date(payslip.uploadedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void download(payslip)}
                        disabled={downloading !== null}
                        className="btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--brand-600)] disabled:opacity-60"
                      >
                        <Icon name={downloading === payslip.id ? "LoaderCircle" : "Download"} size={14} className={downloading === payslip.id ? "animate-spin" : ""} />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={page}
            pageSize={50}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            loading={loading}
            label="payslips"
          />
        </section>
      )}
    </div>
  );
}
