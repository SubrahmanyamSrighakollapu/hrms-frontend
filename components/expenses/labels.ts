import type { BadgeTone } from "@/components/ui/Badge";
import type { ExpensePaymentMode, ExpenseStatus } from "@/lib/expenses";

export const STATUS_LABEL: Record<ExpenseStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  CLARIFICATION: "Clarification",
  REJECTED: "Rejected",
  REIMBURSED: "Reimbursed",
};

export const STATUS_TONE: Record<ExpenseStatus, BadgeTone> = {
  DRAFT: "muted",
  SUBMITTED: "info",
  APPROVED: "success",
  CLARIFICATION: "warning",
  REJECTED: "danger",
  REIMBURSED: "brand",
};

export const STATUS_ORDER: ExpenseStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "CLARIFICATION",
  "REJECTED",
  "REIMBURSED",
];

/** Statuses whose outcome is final — no further employee action is possible. */
export const TERMINAL_STATUSES: ExpenseStatus[] = ["APPROVED", "REJECTED", "REIMBURSED"];

export const PAYMENT_LABEL: Record<ExpensePaymentMode, string> = {
  CASH: "Cash",
  CARD: "Card",
  UPI: "UPI",
  BANK_TRANSFER: "Bank transfer",
  OTHER: "Other",
};

export const PAYMENT_ORDER: ExpensePaymentMode[] = ["CASH", "CARD", "UPI", "BANK_TRANSFER", "OTHER"];

const CURRENCY_SYMBOL: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

/** "₹12,340.00" — falls back to the ISO code for unknown currencies. */
export function formatMoney(amount: number, currency = "INR"): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? `${currency} `;
  return `${symbol}${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "23 Nov 2026" */
export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

/** "23 Nov 2026, 14:05" */
export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** yyyy-mm-dd for `<input type="date">`. */
export function toDateInput(value: string | null): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

/** True while the owner may still edit lines and attach receipts. */
export function isEditable(status: ExpenseStatus): boolean {
  return status === "DRAFT" || status === "CLARIFICATION";
}

/** Trigger a browser download for a Blob. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
