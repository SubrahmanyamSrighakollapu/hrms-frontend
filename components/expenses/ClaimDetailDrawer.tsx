"use client";

import { useRef, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import {
  decideClaim,
  deleteClaim,
  downloadReceipt,
  reimburseClaim,
  submitClaim,
  uploadReceipt,
  type ExpenseClaim,
  type ExpenseDecision,
  type ExpensePaymentMode,
} from "@/lib/expenses";
import {
  PAYMENT_LABEL,
  PAYMENT_ORDER,
  STATUS_LABEL,
  STATUS_TONE,
  formatDate,
  formatDateTime,
  formatMoney,
  isEditable,
  saveBlob,
} from "./labels";

interface Props {
  claim: ExpenseClaim | null;
  open: boolean;
  onClose: () => void;
  canManage: boolean;
  /** Owner of the claim may edit lines and attach receipts. */
  isOwner: boolean;
  onUpdated: (claim: ExpenseClaim) => void;
  onDeleted: (id: string) => void;
  onEditRequest: (claim: ExpenseClaim) => void;
}

const DECISION_META: Record<ExpenseDecision, { label: string; tone: "success" | "danger" | "warning"; icon: string }> = {
  APPROVED: { label: "Approve", tone: "success", icon: "CheckCircle2" },
  REJECTED: { label: "Reject", tone: "danger", icon: "XCircle" },
  CLARIFICATION: { label: "Request clarification", tone: "warning", icon: "AlertCircle" },
};

export function ClaimDetailDrawer({
  claim,
  open,
  onClose,
  canManage,
  isOwner,
  onUpdated,
  onDeleted,
  onEditRequest,
}: Props) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<ExpenseDecision | null>(null);
  const [note, setNote] = useState("");
  const [reimburseOpen, setReimburseOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<ExpensePaymentMode>("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const editable = claim ? isOwner && isEditable(claim.status) : false;

  const run = async (fn: () => Promise<ExpenseClaim>, message: string) => {
    setBusy(true);
    try {
      const updated = await fn();
      onUpdated(updated);
      toast.success(message);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = () => claim && run(() => submitClaim(claim.id), "Claim submitted for approval");

  const handleDelete = async () => {
    if (!claim) return;
    setBusy(true);
    try {
      await deleteClaim(claim.id);
      toast.success("Claim deleted");
      setConfirmDelete(false);
      onDeleted(claim.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the claim");
    } finally {
      setBusy(false);
    }
  };

  const handleDecision = async () => {
    if (!claim || !decision) return;
    const ok = await run(
      () => decideClaim(claim.id, { decision, note: note.trim() || undefined }),
      `Claim ${DECISION_META[decision].label.toLowerCase()}d`,
    );
    if (ok) {
      setDecision(null);
      setNote("");
    }
  };

  const handleReimburse = async () => {
    if (!claim) return;
    const ok = await run(
      () => reimburseClaim(claim.id, { paymentMode, reference: reference.trim() || undefined }),
      "Claim marked as reimbursed",
    );
    if (ok) {
      setReimburseOpen(false);
      setReference("");
    }
  };

  const triggerUpload = (itemId: string) => {
    setPendingItemId(itemId);
    fileRef.current?.click();
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !claim || !pendingItemId) return;
    setBusy(true);
    try {
      const item = await uploadReceipt(claim.id, pendingItemId, file);
      onUpdated({ ...claim, items: claim.items.map((line) => (line.id === item.id ? item : line)) });
      toast.success("Receipt attached");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not attach the receipt");
    } finally {
      setBusy(false);
      setPendingItemId(null);
    }
  };

  const handleDownload = async (itemId: string) => {
    if (!claim) return;
    try {
      const blob = await downloadReceipt(claim.id, itemId);
      saveBlob(blob, `${claim.code}-receipt`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not download the receipt");
    }
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={claim?.title ?? "Expense claim"}
        subtitle={claim ? `${claim.code} · ${claim.employeeName ?? claim.employeeEmail}` : undefined}
        size="lg"
        footer={
          claim ? (
            <div className="flex w-full flex-wrap items-center justify-end gap-2">
              {editable && (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    disabled={busy}
                    className="btn-ghost inline-flex h-9 items-center gap-1.5 px-3 text-[0.84rem] text-[var(--danger)] disabled:opacity-60"
                  >
                    <Icon name="Trash2" size={15} /> Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditRequest(claim)}
                    disabled={busy}
                    className="btn-ghost inline-flex h-9 items-center gap-1.5 px-3 text-[0.84rem] disabled:opacity-60"
                  >
                    <Icon name="Pencil" size={15} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={busy}
                    className="btn-primary inline-flex h-9 items-center gap-1.5 px-3.5 text-[0.84rem] disabled:opacity-60"
                  >
                    {busy ? <Icon name="RefreshCw" size={15} className="animate-spin" /> : <Icon name="Send" size={15} />}
                    Submit
                  </button>
                </>
              )}
              {canManage && claim.status === "SUBMITTED" && (
                <>
                  <button
                    type="button"
                    onClick={() => setDecision("REJECTED")}
                    disabled={busy}
                    className="btn-ghost h-9 px-3 text-[0.84rem] text-[var(--danger)] disabled:opacity-60"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision("CLARIFICATION")}
                    disabled={busy}
                    className="btn-ghost h-9 px-3 text-[0.84rem] text-[var(--warning)] disabled:opacity-60"
                  >
                    Request clarification
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision("APPROVED")}
                    disabled={busy}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--success)] px-3.5 text-[0.84rem] font-medium text-white hover:opacity-90 disabled:opacity-60"
                  >
                    <Icon name="Check" size={15} /> Approve
                  </button>
                </>
              )}
              {canManage && claim.status === "APPROVED" && (
                <button
                  type="button"
                  onClick={() => setReimburseOpen(true)}
                  disabled={busy}
                  className="btn-primary inline-flex h-9 items-center gap-1.5 px-3.5 text-[0.84rem] disabled:opacity-60"
                >
                  <Icon name="Banknote" size={15} /> Mark reimbursed
                </button>
              )}
            </div>
          ) : null
        }
      >
        {claim && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[claim.status]}>{STATUS_LABEL[claim.status]}</Badge>
              <span className="text-sm font-semibold text-[var(--text)]">
                {formatMoney(claim.totalAmount, claim.currency)}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {claim.itemCount} line{claim.itemCount === 1 ? "" : "s"}
              </span>
            </div>

            {claim.description && (
              <p className="text-sm leading-relaxed text-[var(--text-muted)] whitespace-pre-wrap">{claim.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <Meta label="Submitted" value={formatDateTime(claim.submittedAt)} />
              <Meta label="Decided by" value={claim.decidedByName ?? "—"} />
              <Meta label="Decision on" value={formatDateTime(claim.decidedAt)} />
              <Meta label="Reimbursed by" value={claim.reimbursedByName ?? "—"} />
              {claim.reimbursedAt && (
                <>
                  <Meta label="Reimbursed on" value={formatDateTime(claim.reimbursedAt)} />
                  <Meta
                    label="Payment"
                    value={
                      claim.paymentMode
                        ? `${PAYMENT_LABEL[claim.paymentMode]}${claim.reimbursementRef ? ` · ${claim.reimbursementRef}` : ""}`
                        : "—"
                    }
                  />
                </>
              )}
            </div>

            {claim.decisionNote && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Decision note</div>
                <p className="mt-1 text-sm text-[var(--text)] whitespace-pre-wrap">{claim.decisionNote}</p>
              </div>
            )}

            <div>
              <div className="mb-2 text-sm font-semibold text-[var(--text)]">Expense lines</div>
              <div className="card divide-y divide-[var(--border)] overflow-hidden">
                {claim.items.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-3.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--text)]">{item.categoryName}</span>
                        <span className="text-xs text-[var(--text-muted)]">{formatDate(item.expenseDate)}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {PAYMENT_LABEL[item.paymentMode]}
                        {item.description ? ` · ${item.description}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text)]">
                        {formatMoney(item.amount, claim.currency)}
                      </span>
                      {item.hasReceipt ? (
                        <button
                          type="button"
                          onClick={() => handleDownload(item.id)}
                          title={item.receiptFilename ?? "Download receipt"}
                          className="inline-flex h-8 items-center gap-1 rounded-md bg-[var(--surface-2)] px-2.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--slate-100)]"
                        >
                          <Icon name="Download" size={13} /> Receipt
                        </button>
                      ) : editable ? (
                        <button
                          type="button"
                          onClick={() => triggerUpload(item.id)}
                          disabled={busy}
                          className="inline-flex h-8 items-center gap-1 rounded-md bg-[var(--brand-50)] px-2.5 text-xs font-medium text-[var(--brand-700)] hover:opacity-90 disabled:opacity-60"
                        >
                          <Icon name="Upload" size={13} /> Attach
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--text-subtle)]">No receipt</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {editable && (
                <p className="mt-2 text-xs text-[var(--text-subtle)]">
                  Attach receipts for any line that exceeds its category threshold before submitting.
                </p>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="application/pdf,image/png,image/jpeg,image/webp,image/gif,text/plain"
        onChange={handleFile}
      />

      <Modal
        open={!!decision}
        onClose={() => !busy && setDecision(null)}
        tone={decision ? DECISION_META[decision].tone : "brand"}
        icon={decision ? DECISION_META[decision].icon : undefined}
        title={decision ? `${DECISION_META[decision].label} this claim?` : ""}
        description={claim ? `${claim.code} · ${claim.employeeName ?? claim.employeeEmail} · ${formatMoney(claim.totalAmount, claim.currency)}` : undefined}
        footer={
          <>
            <button type="button" onClick={() => setDecision(null)} disabled={busy} className="btn-ghost h-9 px-4 text-[0.84rem] disabled:opacity-60">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDecision}
              disabled={busy}
              className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[0.84rem] disabled:opacity-60"
            >
              {busy && <Icon name="RefreshCw" size={15} className="animate-spin" />}
              Confirm
            </button>
          </>
        }
      >
        <Field label="Note (optional)" htmlFor="exp-decision-note">
          <Textarea
            id="exp-decision-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add context for the employee…"
          />
        </Field>
      </Modal>

      <Modal
        open={reimburseOpen}
        onClose={() => !busy && setReimburseOpen(false)}
        tone="success"
        icon="Banknote"
        title="Mark claim as reimbursed"
        description={claim ? `${claim.code} · ${formatMoney(claim.totalAmount, claim.currency)}` : undefined}
        footer={
          <>
            <button type="button" onClick={() => setReimburseOpen(false)} disabled={busy} className="btn-ghost h-9 px-4 text-[0.84rem] disabled:opacity-60">
              Cancel
            </button>
            <button type="button" onClick={handleReimburse} disabled={busy} className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[0.84rem] disabled:opacity-60">
              {busy && <Icon name="RefreshCw" size={15} className="animate-spin" />}
              Mark reimbursed
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Payment mode" htmlFor="exp-pay-mode">
            <Select id="exp-pay-mode" value={paymentMode} onChange={(event) => setPaymentMode(event.target.value as ExpensePaymentMode)}>
              {PAYMENT_ORDER.map((mode) => (
                <option key={mode} value={mode}>
                  {PAYMENT_LABEL[mode]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Reference (optional)" hint="UTR / transaction reference for audit." htmlFor="exp-pay-ref">
            <Input id="exp-pay-ref" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="e.g. UTR12345" maxLength={120} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => !busy && setConfirmDelete(false)}
        tone="danger"
        icon="Trash2"
        title="Delete this draft claim?"
        description="This permanently removes the claim and any attached receipts."
        footer={
          <>
            <button type="button" onClick={() => setConfirmDelete(false)} disabled={busy} className="btn-ghost h-9 px-4 text-[0.84rem] disabled:opacity-60">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--danger)] px-4 text-[0.84rem] font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {busy && <Icon name="RefreshCw" size={15} className="animate-spin" />}
              Delete
            </button>
          </>
        }
      />
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</div>
      <div className="mt-0.5 font-medium text-[var(--text)]">{value}</div>
    </div>
  );
}
