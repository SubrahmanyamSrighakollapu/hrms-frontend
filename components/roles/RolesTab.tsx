"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { TablePagination, useClientPagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import {
  createRole,
  deleteRole,
  emptyPermissions,
  roleStats,
  saveRole,
  type RoleDef,
} from "@/lib/rbac";

/** Roles tab — define the roles that access is granted through. */
export function RolesTab({ roles, canManage }: { roles: RoleDef[]; canManage: boolean }) {
  const toast = useToast();

  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const [editTarget, setEditTarget] = useState<RoleDef | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<RoleDef | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) => r.name.toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q),
    );
  }, [roles, search]);

  const pag = useClientPagination(filtered, 10);

  const add = async () => {
    const value = name.trim();
    if (!value) return;
    setBusy(true);
    try {
      await createRole({
        name: value,
        description: "",
        permissions: { ...emptyPermissions(), dashboard: "VIEW" },
      });
      setName("");
      toast.success(`Role "${value}" created.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the role.");
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (role: RoleDef) => {
    setEditTarget(role);
    setEditName(role.name);
    setEditDescription(role.description ?? "");
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    setBusy(true);
    try {
      await saveRole(editTarget.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        permissions: editTarget.permissions,
      });
      toast.success("Role updated.");
      setEditTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the role.");
    } finally {
      setBusy(false);
    }
  };

  const submitDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteRole(deleteTarget.id);
      toast.success(`Role "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the role.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Inline create */}
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="new-role" className="mb-1.5 block text-[0.78rem] font-medium text-[var(--text)]">
            Role name
          </label>
          <input
            id="new-role"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canManage && add()}
            disabled={!canManage || busy}
            placeholder="e.g. Team Lead, Finance Manager"
            className="input-base py-2 text-sm disabled:bg-[var(--surface-2)]"
          />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!canManage || busy || name.trim().length < 2}
          className="btn-primary inline-flex h-10 items-center gap-2 px-4 text-[0.84rem] disabled:opacity-50"
        >
          <Icon name={busy ? "RefreshCw" : "Plus"} size={15} className={busy ? "animate-spin" : ""} /> Add role
        </button>
        <p className="w-full text-[0.75rem] text-[var(--text-subtle)]">
          A role holds module permissions. Create it here, set its access on the{" "}
          <b className="font-semibold text-[var(--text-muted)]">Permissions</b> tab, then assign people on the{" "}
          <b className="font-semibold text-[var(--text-muted)]">Assignee</b> tab.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-4">
          <div className="relative min-w-[200px] flex-1">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); pag.setPage(1); }}
              placeholder="Search roles…"
              className="input-base input-base--leading-icon py-2 text-sm"
            />
          </div>
          <span className="text-[0.8rem] text-[var(--text-muted)]">
            {filtered.length} of {roles.length} role{roles.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--slate-50)]">
              <tr className="text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Module access</th>
                <th className="px-4 py-3 text-center font-medium">Employees</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pag.pageItems.map((role) => {
                const stats = roleStats(role);
                return (
                  <tr key={role.id} className="border-t border-[var(--border)] transition-colors hover:bg-[var(--slate-50)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--brand-50)] text-[var(--brand-700)]">
                          <Icon name="ShieldCheck" size={15} />
                        </span>
                        <span className="font-medium text-[var(--text)]">{role.name}</span>
                      </div>
                    </td>
                    <td className="max-w-[280px] px-4 py-3 text-[var(--text-muted)]">
                      <span className="line-clamp-2">{role.description || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.82rem] font-medium text-[var(--text)]">
                          {stats.reachable}/{stats.total}
                        </span>
                        <span className="text-xs text-[var(--text-subtle)]">modules</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-[var(--slate-100)]">
                        <div
                          className="h-full rounded-full bg-[var(--brand-600)]"
                          style={{ width: `${(stats.reachable / stats.total) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-[var(--text)]">{role.userCount}</td>
                    <td className="px-4 py-3">
                      {role.isSystem ? <Badge tone="muted">System</Badge> : <Badge tone="info">Custom</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(role)}
                          disabled={!canManage}
                          title="Edit role"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--slate-100)] hover:text-[var(--brand-700)] disabled:opacity-40"
                        >
                          <Icon name="Pencil" size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(role)}
                          disabled={!canManage || role.isSystem}
                          title={role.isSystem ? "System roles cannot be deleted" : "Delete role"}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] disabled:opacity-40"
                        >
                          <Icon name="Trash2" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                    <Icon name="ShieldCheck" size={22} className="mx-auto mb-2 text-[var(--text-subtle)]" />
                    No roles match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={pag.page}
          pageSize={pag.pageSize}
          total={pag.total}
          totalPages={pag.totalPages}
          onPageChange={pag.setPage}
          onPageSizeChange={pag.setPageSize}
          label="roles"
        />
      </div>
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        tone="brand"
        icon="Pencil"
        title={`Edit ${editTarget?.name ?? "role"}`}
        description="Rename the role or update what it is responsible for."
        footer={
          <>
            <button type="button" onClick={() => setEditTarget(null)} className="btn-ghost h-9 px-4 text-[0.84rem]">
              Cancel
            </button>
            <button
              type="button"
              onClick={submitEdit}
              disabled={busy || editName.trim().length < 2}
              className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[0.84rem] disabled:opacity-50"
            >
              {busy && <Icon name="RefreshCw" size={15} className="animate-spin" />} Save role
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="edit-role-name" className="mb-1.5 block text-[0.78rem] font-medium text-[var(--text)]">
              Role name
            </label>
            <input
              id="edit-role-name"
              value={editName}
              disabled={editTarget?.isSystem}
              onChange={(e) => setEditName(e.target.value)}
              className="input-base text-sm disabled:bg-[var(--surface-2)] disabled:text-[var(--text-muted)]"
            />
            {editTarget?.isSystem && (
              <p className="mt-1 text-[0.72rem] text-[var(--text-subtle)]">System role names cannot be changed.</p>
            )}
          </div>
          <div>
            <label htmlFor="edit-role-desc" className="mb-1.5 block text-[0.78rem] font-medium text-[var(--text)]">
              Description
            </label>
            <input
              id="edit-role-desc"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="What is this role responsible for?"
              className="input-base text-sm"
            />
          </div>
        </div>
      </Modal>

      {/* Delete role */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        tone="danger"
        icon="Trash2"
        title={`Delete the "${deleteTarget?.name ?? ""}" role?`}
        description={
          deleteTarget?.userCount
            ? `${deleteTarget.userCount} employee${deleteTarget.userCount === 1 ? "" : "s"} on this role will fall back to the Employee role.`
            : "This role has no employees assigned."
        }
        footer={
          <>
            <button type="button" onClick={() => setDeleteTarget(null)} className="btn-ghost h-9 px-4 text-[0.84rem]">
              Cancel
            </button>
            <button
              type="button"
              onClick={submitDelete}
              disabled={busy}
              className="inline-flex h-9 items-center gap-2 rounded-[var(--radius)] bg-[var(--danger)] px-4 text-[0.84rem] font-semibold text-white transition-colors hover:brightness-95 disabled:opacity-60"
            >
              {busy && <Icon name="RefreshCw" size={15} className="animate-spin" />} Delete role
            </button>
          </>
        }
      />
    </div>
  );
}
