import { api } from "@/lib/api";

export type ExpenseStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CLARIFICATION"
  | "REIMBURSED";

export type ExpensePaymentMode = "CASH" | "CARD" | "UPI" | "BANK_TRANSFER" | "OTHER";
export type ExpenseDecision = "APPROVED" | "REJECTED" | "CLARIFICATION";

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  maxAmount: number | null;
  receiptRequiredAbove: number | null;
  active: boolean;
}

export interface ExpenseItem {
  id: string;
  claimId: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  expenseDate: string;
  amount: number;
  description: string | null;
  paymentMode: ExpensePaymentMode;
  hasReceipt: boolean;
  receiptFilename: string | null;
  receiptMimeType: string | null;
  receiptSize: number | null;
}

export interface ExpenseClaim {
  id: string;
  code: string;
  title: string;
  description: string | null;
  currency: string;
  employeeId: string;
  employeeName: string | null;
  employeeEmail: string;
  status: ExpenseStatus;
  totalAmount: number;
  itemCount: number;
  submittedAt: string | null;
  decidedById: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  reimbursedById: string | null;
  reimbursedByName: string | null;
  reimbursedAt: string | null;
  reimbursementRef: string | null;
  paymentMode: ExpensePaymentMode | null;
  createdAt: string;
  updatedAt: string;
  items: ExpenseItem[];
}

export interface ExpenseItemInput {
  categoryId: string;
  expenseDate: string;
  amount: number;
  description?: string;
  paymentMode?: ExpensePaymentMode;
}

export interface ClaimInput {
  title: string;
  description?: string;
  currency?: string;
  items: ExpenseItemInput[];
  submit?: boolean;
}

export interface CategoryInput {
  name: string;
  description?: string | null;
  maxAmount?: number | null;
  receiptRequiredAbove?: number | null;
  active?: boolean;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ClaimListFilters {
  status?: ExpenseStatus;
  categoryId?: string;
  q?: string;
  scope?: "all" | "mine" | "approvals";
  page?: number;
  pageSize?: number;
}

export interface ReportFilters {
  from?: string;
  to?: string;
  status?: ExpenseStatus;
  categoryId?: string;
  employeeId?: string;
  page?: number;
  pageSize?: number;
}

export interface ExpenseStats {
  total: number;
  byStatus: Record<string, number>;
  claimedAmount: number;
  reimbursedAmount: number;
  pendingApprovals: number;
  pendingReimbursement: number;
}

export interface ExpenseReportSummary {
  totalClaims: number;
  claimedAmount: number;
  approvedAmount: number;
  reimbursedAmount: number;
  pendingApprovals: number;
  byStatus: Record<string, number>;
  byCategory: { categoryId: string; categoryName: string; count: number; amount: number }[];
}

export interface ReportEmployee {
  id: string;
  name: string | null;
  email: string;
}

function toQuery(params: object): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

/* ---------------- categories ---------------- */

export async function listCategories(includeInactive = false): Promise<ExpenseCategory[]> {
  const path = includeInactive ? "/expenses/categories/all" : "/expenses/categories";
  const result = await api.get<{ categories: ExpenseCategory[] }>(path);
  return result.categories;
}

export async function createCategory(input: CategoryInput): Promise<ExpenseCategory> {
  const result = await api.post<{ category: ExpenseCategory }>("/expenses/categories", input);
  return result.category;
}

export async function updateCategory(id: string, input: CategoryInput): Promise<ExpenseCategory> {
  const result = await api.patch<{ category: ExpenseCategory }>(`/expenses/categories/${id}`, input);
  return result.category;
}

/* ---------------- claims ---------------- */

export async function listClaims(
  filters: ClaimListFilters = {},
): Promise<{ claims: ExpenseClaim[] } & PageMeta> {
  return api.get<{ claims: ExpenseClaim[] } & PageMeta>(`/expenses${toQuery(filters)}`);
}

export async function getClaim(id: string): Promise<ExpenseClaim> {
  const result = await api.get<{ claim: ExpenseClaim }>(`/expenses/${id}`);
  return result.claim;
}

export async function createClaim(input: ClaimInput): Promise<ExpenseClaim> {
  const result = await api.post<{ claim: ExpenseClaim }>("/expenses", input);
  return result.claim;
}

export async function updateClaim(id: string, input: ClaimInput): Promise<ExpenseClaim> {
  const result = await api.patch<{ claim: ExpenseClaim }>(`/expenses/${id}`, input);
  return result.claim;
}

export async function deleteClaim(id: string): Promise<void> {
  await api.del(`/expenses/${id}`);
}

export async function submitClaim(id: string): Promise<ExpenseClaim> {
  const result = await api.post<{ claim: ExpenseClaim }>(`/expenses/${id}/submit`, {});
  return result.claim;
}

export async function decideClaim(
  id: string,
  input: { decision: ExpenseDecision; note?: string },
): Promise<ExpenseClaim> {
  const result = await api.post<{ claim: ExpenseClaim }>(`/expenses/${id}/decision`, input);
  return result.claim;
}

export async function reimburseClaim(
  id: string,
  input: { paymentMode: ExpensePaymentMode; reference?: string },
): Promise<ExpenseClaim> {
  const result = await api.post<{ claim: ExpenseClaim }>(`/expenses/${id}/reimburse`, input);
  return result.claim;
}

/* ---------------- receipts ---------------- */

export async function uploadReceipt(claimId: string, itemId: string, file: File): Promise<ExpenseItem> {
  const form = new FormData();
  form.append("receipt", file);
  const result = await api.upload<{ item: ExpenseItem }>(
    `/expenses/${claimId}/items/${itemId}/receipt`,
    form,
  );
  return result.item;
}

export async function downloadReceipt(claimId: string, itemId: string): Promise<Blob> {
  return api.download(`/expenses/${claimId}/items/${itemId}/receipt`);
}

/* ---------------- stats + reports ---------------- */

export async function getStats(): Promise<ExpenseStats> {
  const result = await api.get<{ stats: ExpenseStats }>("/expenses/stats");
  return result.stats;
}

export async function listReportEmployees(): Promise<ReportEmployee[]> {
  const result = await api.get<{ employees: ReportEmployee[] }>("/expenses/employees");
  return result.employees;
}

export async function getReport(
  filters: ReportFilters = {},
): Promise<{ claims: ExpenseClaim[]; summary: ExpenseReportSummary } & PageMeta> {
  return api.get<{ claims: ExpenseClaim[]; summary: ExpenseReportSummary } & PageMeta>(
    `/expenses/report${toQuery(filters)}`,
  );
}

export async function exportReport(filters: ReportFilters = {}): Promise<Blob> {
  return api.download(`/expenses/report/export${toQuery(filters)}`);
}
