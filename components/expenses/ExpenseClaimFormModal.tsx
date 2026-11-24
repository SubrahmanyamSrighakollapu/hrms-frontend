"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import {
  createClaim,
  updateClaim,
  type ExpenseCategory,
  type ExpenseClaim,
  type ExpenseItemInput,
  type ExpensePaymentMode,
} from "@/lib/expenses";
import { PAYMENT_LABEL, PAYMENT_ORDER, formatMoney, toDateInput } from "./labels";

interface DraftLine {
  key: string;
  categoryId: string;
  expenseDate: string;
  amount: string;
  description: string;
  paymentMode: ExpensePaymentMode;
}

interface Props {
  open: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  /** null → create a new claim; otherwise edit this draft/clarification claim. */
  editing: ExpenseClaim | null;
  onSaved: (claim: ExpenseClaim) => void;
}

const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

let lineSeq = 0;
function blankLine(categoryId = ""): DraftLine {
  lineSeq += 1;
  return {
    key: `line-${lineSeq}`,
    categoryId,
    expenseDate: new Date().toISOString().slice(0, 10),
    amount: "",
    description: "",
    paymentMode: "OTHER",
  };
}

export function ExpenseClaimFormModal({ open, onClose, categories, editing, onSaved }: Props) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [lines, setLines] = useState<DraftLine[]>([blankLine()]);
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description ?? "");
      setCurrency(editing.currency);
      setLines(
        editing.items.length > 0
          ? editing.items.map((item) => {
              lineSeq += 1;
              return {
                key: `line-${lineSeq}`,
                categoryId: item.categoryId,
                expenseDate: toDateInput(item.expenseDate),
                amount: String(item.amount),
                description: item.description ?? "",
                paymentMode: item.paymentMode,
              };
            })
          : [blankLine(categories[0]?.id)],
      );
    } else {
      setTitle("");
      setDescription("");
      setCurrency("INR");
      setLines([blankLine(categories[0]?.id)]);
    }
  }, [open, editing, categories]);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + (Number.parseFloat(line.amount) || 0), 0),
    [lines],
  );

  const patchLine = (key: string, patch: Partial<DraftLine>) => {
    setLines((list) => list.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const addLine = () => setLines((list) => [...list, blankLine(categories[0]?.id)]);
  const removeLine = (key: string) => setLines((list) => (list.length > 1 ? list.filter((line) => line.key !== key) : list));

  const buildItems = (): ExpenseItemInput[] =>
    lines.map((line) => ({
      categoryId: line.categoryId,
      expenseDate: line.expenseDate,
      amount: Number.parseFloat(line.amount),
      description: line.description.trim() || undefined,
      paymentMode: line.paymentMode,
    }));

  const validate = (): string | null => {
    if (!title.trim()) return "Give the claim a title";
    if (lines.length === 0) return "Add at least one expense line";
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line.categoryId) return `Line ${i + 1}: choose a category`;
      if (!line.expenseDate) return `Line ${i + 1}: choose the expense date`;
      const amount = Number.parseFloat(line.amount);
      if (!Number.isFinite(amount) || amount <= 0) return `Line ${i + 1}: enter an amount greater than zero`;
    }
    return null;
  };

  const save = async (submit: boolean) => {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }
    setSaving(submit ? "submit" : "draft");
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        currency,
        items: buildItems(),
        submit,
      };
      const claim = editing ? await updateClaim(editing.id, payload) : await createClaim(payload);
      toast.success(editing ? "Claim updated" : submit ? "Claim submitted for approval" : "Draft claim saved");
      onSaved(claim);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the claim");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title={editing ? "Edit expense claim" : "New expense claim"}
      description="Bundle related expenses into one claim and submit it for approval."
      footer={
        <>
          <button type="button" onClick={onClose} disabled={!!saving} className="btn-ghost h-9 px-4 text-[0.84rem] disabled:opacity-60">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => save(false)}
            disabled={!!saving}
            className="btn-ghost inline-flex h-9 items-center gap-2 px-4 text-[0.84rem] disabled:opacity-60"
          >
            {saving === "draft" && <Icon name="RefreshCw" size={15} className="animate-spin" />}
            Save draft
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={!!saving}
            className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[0.84rem] disabled:opacity-60"
          >
            {saving === "submit" && <Icon name="RefreshCw" size={15} className="animate-spin" />}
            Save &amp; submit
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
          <Field label="Title" required htmlFor="exp-title">
            <Input id="exp-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Client visit — Bengaluru" maxLength={160} />
          </Field>
          <Field label="Currency" htmlFor="exp-currency">
            <Select id="exp-currency" value={currency} onChange={(event) => setCurrency(event.target.value)}>
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Description (optional)" htmlFor="exp-desc">
          <Textarea id="exp-desc" rows={2} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Context for the approver…" maxLength={2000} />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[0.82rem] font-medium text-[var(--text)]">Expense lines</span>
            <button type="button" onClick={addLine} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-700)] hover:underline">
              <Icon name="Plus" size={13} /> Add line
            </button>
          </div>

          <div className="space-y-2.5">
            {lines.map((line, index) => {
              const category = categories.find((option) => option.id === line.categoryId);
              return (
                <div key={line.key} className="rounded-lg border border-[var(--border)] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[0.72rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                      Line {index + 1}
                    </span>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        aria-label="Remove line"
                        className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-subtle)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                      >
                        <Icon name="Trash2" size={13} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <label className="col-span-2 text-xs text-[var(--text-muted)] sm:col-span-1">
                      Category
                      <Select
                        className="mt-1"
                        value={line.categoryId}
                        onChange={(event) => patchLine(line.key, { categoryId: event.target.value })}
                      >
                        <option value="">Select…</option>
                        {categories.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </Select>
                    </label>
                    <label className="text-xs text-[var(--text-muted)]">
                      Date
                      <Input className="mt-1" type="date" value={line.expenseDate} onChange={(event) => patchLine(line.key, { expenseDate: event.target.value })} />
                    </label>
                    <label className="text-xs text-[var(--text-muted)]">
                      Amount
                      <Input
                        className="mt-1"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={line.amount}
                        onChange={(event) => patchLine(line.key, { amount: event.target.value })}
                        placeholder="0.00"
                      />
                    </label>
                    <label className="text-xs text-[var(--text-muted)]">
                      Payment
                      <Select className="mt-1" value={line.paymentMode} onChange={(event) => patchLine(line.key, { paymentMode: event.target.value as ExpensePaymentMode })}>
                        {PAYMENT_ORDER.map((mode) => (
                          <option key={mode} value={mode}>
                            {PAYMENT_LABEL[mode]}
                          </option>
                        ))}
                      </Select>
                    </label>
                  </div>
                  <Input
                    className="mt-2.5"
                    value={line.description}
                    onChange={(event) => patchLine(line.key, { description: event.target.value })}
                    placeholder="What was this for? (optional)"
                    maxLength={300}
                  />
                  {category && (category.maxAmount !== null || category.receiptRequiredAbove !== null) && (
                    <p className="mt-1.5 text-[0.7rem] text-[var(--text-subtle)]">
                      {category.maxAmount !== null && `Max ${formatMoney(category.maxAmount, currency)}`}
                      {category.maxAmount !== null && category.receiptRequiredAbove !== null && " · "}
                      {category.receiptRequiredAbove !== null && `Receipt required above ${formatMoney(category.receiptRequiredAbove, currency)}`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-[var(--surface-2)] px-3.5 py-2.5 text-sm">
          <span className="font-medium text-[var(--text-muted)]">Total</span>
          <span className="font-semibold text-[var(--text)]">{formatMoney(total, currency)}</span>
        </div>
      </div>
    </Modal>
  );
}
