"use client";

import { useCallback, useEffect, useState } from "react";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
  type Department,
  type DepartmentInput,
} from "@/lib/organization";
import { useAuth } from "@/lib/auth-context";

export default function DepartmentsPage() {
  const toast = useToast();
  const { can } = useAuth();
  const canManage = can("organization", "MANAGE");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const [form, setForm] = useState<DepartmentInput>({ name: "", code: "", description: "" });

  const refresh = useCallback(async () => {
    const result = await listDepartments();
    setDepartments(result);
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;
    listDepartments()
      .then((result) => {
        if (active) {
          setDepartments(result);
          setError(null);
        }
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load departments");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", code: "", description: "" });
    setModalOpen(true);
  };

  const openEdit = (department: Department) => {
    setEditing(department);
    setForm({ name: department.name, code: department.code, description: department.description });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) await updateDepartment(editing.id, form);
      else await createDepartment(form);
      await refresh();
      setModalOpen(false);
      toast.success(editing ? "Department updated" : "Department created");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save department");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await deleteDepartment(deleting.id);
      await refresh();
      toast.success("Department deleted");
      setDeleting(null);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not delete department");
    }
  };

  return (
    <div>
      <PageHeader title="Departments" subtitle="Departments and membership from the employee directory" actions={
        canManage && <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2 px-3.5 py-2 text-sm"><Icon name="Plus" size={15} /> Add department</button>
      } />

      {error ? (
        <div className="card p-8 text-center">
          <p className="font-medium text-[var(--text)]">Departments could not be loaded</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); setRetry((value) => value + 1); }} className="btn-primary mt-4 px-4 py-2 text-sm">Try again</button>
        </div>
      ) : loading ? (
        <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading departments…</div>
      ) : departments.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => (
            <article key={department.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)]">
                  <Icon name="Layers" size={22} />
                </div>
                {canManage && (
                  <Dropdown trigger={({ toggle }) => (
                    <button type="button" onClick={toggle} aria-label={`Actions for ${department.name}`} className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
                      <Icon name="MoreVertical" size={16} />
                    </button>
                  )}>
                    {(close) => (
                      <>
                        <DropdownItem icon="Pencil" onClick={() => { close(); openEdit(department); }}>Edit department</DropdownItem>
                        <DropdownItem icon="Trash2" danger disabled={department.employeeCount > 0} onClick={() => { close(); setDeleting(department); }}>Delete department</DropdownItem>
                      </>
                    )}
                  </Dropdown>
                )}
              </div>
              <h2 className="mt-3 font-bold text-[var(--text)]">{department.name}</h2>
              {department.code && <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-[var(--text-subtle)]">{department.code}</p>}
              <p className="mt-2 min-h-10 text-sm text-[var(--text-muted)]">{department.description || "No description"}</p>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-sm">
                <span className="text-[var(--text-muted)]">Employees</span>
                <span className="font-semibold text-[var(--text)]">{department.employeeCount}</span>
              </div>
              {canManage && department.employeeCount > 0 && (
                <p className="mt-2 text-[0.7rem] text-[var(--text-subtle)]">Move employees before deleting this department.</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <Icon name="Layers" size={30} className="mx-auto text-[var(--brand-300)]" />
          <p className="mt-3 font-medium text-[var(--text)]">No departments yet</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Create a department to organize employee records.</p>
          {canManage && <button onClick={openCreate} className="btn-primary mt-4 px-4 py-2 text-sm">Add department</button>}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit department" : "Add department"}
        description="Department information is shared with employee records."
        footer={<><button onClick={() => setModalOpen(false)} className="btn-ghost px-3 py-2 text-sm">Cancel</button><button onClick={save} disabled={saving || !form.name.trim()} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">{saving ? "Saving…" : editing ? "Save changes" : "Create department"}</button></>}
      >
        <div className="space-y-3">
          <Field label="Name" required><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={80} /></Field>
          <Field label="Code"><Input value={form.code ?? ""} onChange={(event) => setForm({ ...form, code: event.target.value || null })} maxLength={16} /></Field>
          <Field label="Description"><Textarea rows={3} value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value || null })} maxLength={240} /></Field>
        </div>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete department?"
        description={`Delete ${deleting?.name ?? "this department"}? This cannot be undone.`}
        tone="danger"
        footer={<><button onClick={() => setDeleting(null)} className="btn-ghost px-3 py-2 text-sm">Cancel</button><button onClick={remove} className="btn-danger px-4 py-2 text-sm">Delete</button></>}
      />
    </div>
  );
}
