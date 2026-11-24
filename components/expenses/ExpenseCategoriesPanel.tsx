"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { TablePagination, useClientPagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import {
  createCategory,
  listCategories,
  updateCategory,
  type CategoryInput,
  type ExpenseCategory,
} from "@/lib/expenses";
import { formatMoney } from "./labels";

interface FormState {
  name: string;
  description: string;
  maxAmount: string;
  receiptRequiredAbove: string;
  active: boolean;
}

const EMPTY_FORM: FormState = { name: "", description: "", maxAmount: "", receiptRequiredAbove: "", active: true };

function toInput(form: FormState): CategoryInput {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    maxAmount: form.maxAmount.trim() === "" ? null : Number.parseFloat(form.maxAmount),
    receiptRequiredAbove: form.receiptRequiredAbove.trim() === "" ? null : Number.parseFloat(form.receiptRequiredAbove),
    active: form.active,
  };
}

export function ExpenseCategoriesPanel() {
  const toast = useToast();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await listCategories(true));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const { page, pageSize, total, totalPages, pageItems, setPage, setPageSize } = useClientPagination(categories, 10);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (category: ExpenseCategory) => {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description ?? "",
      maxAmount: category.maxAmount === null ? "" : String(category.maxAmount),
      receiptRequiredAbove: category.receiptRequiredAbove === null ? "" : String(category.receiptRequiredAbove),
      active: category.active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, toInput(form));
        toast.success("Category updated");
      } else {
        await createCategory(toInput(form));
        toast.success("Category created");
      }
      setOpen(false);
      setEditing(null);
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save the category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)]">
          Categories drive expense policy — set a maximum amount and the threshold above which a receipt is required.
        </p>
        <button type="button" onClick={openCreate} className="btn-primary inline-flex h-9 items-center gap-2 px-3.5 text-sm">
          <Icon name="Plus" size={16} /> New category
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] px-3.5 py-2.5 text-[0.82rem] text-[var(--danger)]">
          <Icon name="AlertCircle" size={15} /> {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--slate-50)]">
              <tr className="text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Max amount</th>
                <th className="px-4 py-3 text-right font-medium">Receipt above</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                    Loading categories…
                  </td>
                </tr>
              )}

              {!loading &&
                pageItems.map((category) => (
                  <tr key={category.id} className="border-t border-[var(--border)] transition-colors hover:bg-[var(--slate-50)]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text)]">{category.name}</div>
                      {category.description && <div className="text-xs text-[var(--text-muted)]">{category.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-muted)]">
                      {category.maxAmount === null ? "No limit" : formatMoney(category.maxAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-muted)]">
                      {category.receiptRequiredAbove === null ? "Always optional" : formatMoney(category.receiptRequiredAbove)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={category.active ? "success" : "muted"}>{category.active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(category)}
                        className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-[var(--brand-700)] hover:bg-[var(--brand-50)]"
                      >
                        <Icon name="Pencil" size={13} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}

              {!loading && categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                    <Icon name="Receipt" size={22} className="mx-auto mb-2 text-[var(--text-subtle)]" />
                    No expense categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          loading={loading}
          label="categories"
        />
      </div>

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={editing ? "Edit category" : "New expense category"}
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} disabled={saving} className="btn-ghost h-9 px-4 text-[0.84rem] disabled:opacity-60">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[0.84rem] disabled:opacity-60">
              {saving && <Icon name="RefreshCw" size={15} className="animate-spin" />}
              {editing ? "Save changes" : "Create"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" required htmlFor="cat-name">
            <Input id="cat-name" value={form.name} onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))} maxLength={80} placeholder="e.g. Travel" />
          </Field>
          <Field label="Description (optional)" htmlFor="cat-desc">
            <Textarea id="cat-desc" rows={2} value={form.description} onChange={(event) => setForm((f) => ({ ...f, description: event.target.value }))} maxLength={400} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Max amount" hint="Leave blank for no cap." htmlFor="cat-max">
              <Input
                id="cat-max"
                type="number"
                min="0"
                step="0.01"
                value={form.maxAmount}
                onChange={(event) => setForm((f) => ({ ...f, maxAmount: event.target.value }))}
                placeholder="0.00"
              />
            </Field>
            <Field label="Receipt required above" hint="Blank means never required." htmlFor="cat-receipt">
              <Input
                id="cat-receipt"
                type="number"
                min="0"
                step="0.01"
                value={form.receiptRequiredAbove}
                onChange={(event) => setForm((f) => ({ ...f, receiptRequiredAbove: event.target.value }))}
                placeholder="0.00"
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm((f) => ({ ...f, active: event.target.checked }))} />
            Active — available when employees build a claim
          </label>
        </div>
      </Modal>
    </div>
  );
}
