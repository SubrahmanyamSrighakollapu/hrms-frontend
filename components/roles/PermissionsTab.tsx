"use client";

import { Fragment, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import {
  emptyPermissions,
  grantAll,
  LEVELS,
  LEVEL_LABEL,
  MODULES,
  MODULE_SECTIONS,
  roleStats,
  saveRole,
  type PermissionLevel,
  type RoleDef,
} from "@/lib/rbac";

const LEVEL_NOTE: Record<PermissionLevel, string> = {
  NONE: "Module is hidden",
  VIEW: "Read-only access",
  MANAGE: "Full access",
};

/** Permissions tab — the module × access-level matrix for a single role. */
export function PermissionsTab({ roles, canManage }: { roles: RoleDef[]; canManage: boolean }) {
  const toast = useToast();

  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [draftState, setDraftState] = useState<{
    roleId: string;
    permissions: Record<string, PermissionLevel>;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  // Fall back to the first role whenever the selection is empty or has gone away.
  const roleId = roles.some((r) => r.id === selectedRoleId) ? selectedRoleId : (roles[0]?.id ?? "");
  const role = useMemo(() => roles.find((r) => r.id === roleId) ?? null, [roles, roleId]);

  // The working copy, kept separate from the saved permissions until "Save".
  const draft = useMemo(
    () => (draftState?.roleId === roleId ? draftState.permissions : (role?.permissions ?? {})),
    [draftState, roleId, role],
  );
  const setDraft = (permissions: Record<string, PermissionLevel>) => setDraftState({ roleId, permissions });

  const dirty = useMemo(() => {
    if (!role) return false;
    return MODULES.some((m) => (draft[m.id] ?? "NONE") !== (role.permissions[m.id] ?? "NONE"));
  }, [role, draft]);

  const stats = useMemo(() => {
    const reachable = MODULES.filter((m) => (draft[m.id] ?? "NONE") !== "NONE").length;
    const managed = MODULES.filter((m) => (draft[m.id] ?? "NONE") === "MANAGE").length;
    return { reachable, managed, total: MODULES.length };
  }, [draft]);

  const setLevel = (moduleId: string, level: PermissionLevel) =>
    setDraftState((prev) => {
      const base = prev?.roleId === roleId ? prev.permissions : (role?.permissions ?? {});
      return { roleId, permissions: { ...base, [moduleId]: level } };
    });

  const setSection = (section: string, level: PermissionLevel) =>
    setDraftState((prev) => {
      const base = prev?.roleId === roleId ? prev.permissions : (role?.permissions ?? {});
      const next = { ...base };
      MODULES.filter((m) => m.section === section).forEach((m) => {
        next[m.id] = level;
      });
      return { roleId, permissions: next };
    });

  const save = async () => {
    if (!role) return;
    setBusy(true);
    try {
      await saveRole(role.id, {
        name: role.name,
        description: role.description ?? "",
        permissions: draft,
      });
      toast.success(`Permissions saved for ${role.name}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the permissions.");
    } finally {
      setBusy(false);
    }
  };

  if (!roles.length) {
    return (
      <div className="card p-10 text-center text-sm text-[var(--text-muted)]">
        Create a role first, then grant its module access here.
      </div>
    );
  }

  if (!role) {
    return <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Select a role to configure its access.</div>;
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="perm-role" className="mb-1.5 block text-[0.78rem] font-medium text-[var(--text)]">
            Select role
          </label>
          <select
            id="perm-role"
            value={roleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="input-base py-2 text-sm"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDraft(grantAll("MANAGE"))}
            disabled={!canManage}
            className="btn-ghost inline-flex h-10 items-center gap-2 px-3.5 text-[0.84rem] disabled:opacity-50"
          >
            <Icon name="ShieldHalf" size={15} /> Grant all
          </button>
          <button
            type="button"
            onClick={() => setDraft(emptyPermissions())}
            disabled={!canManage}
            className="btn-ghost inline-flex h-10 items-center gap-2 px-3.5 text-[0.84rem] disabled:opacity-50"
          >
            <Icon name="X" size={15} /> Clear all
          </button>
        </div>
      </div>

      {/* Matrix */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-4">
          <div>
            <h3 className="text-[0.92rem] font-semibold text-[var(--text)]">
              Module access for <span className="text-[var(--brand-700)]">{role?.name}</span>
            </h3>
            <p className="mt-0.5 text-[0.78rem] text-[var(--text-muted)]">
              {stats.reachable} of {stats.total} modules reachable · {stats.managed} fully managed
            </p>
          </div>
          {dirty && <Badge tone="warning">Unsaved changes</Badge>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--slate-50)]">
              <tr className="text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Module</th>
                {LEVELS.map((lv) => (
                  <th key={lv} className="w-[130px] px-4 py-3 text-center font-medium">
                    <div>{lv === "NONE" ? "No access" : lv === "VIEW" ? "View" : "Manage"}</div>
                    <div className="mt-0.5 text-[0.68rem] font-normal text-[var(--text-subtle)]">{LEVEL_NOTE[lv]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULE_SECTIONS.map((section) => {
                const mods = MODULES.filter((m) => m.section === section);
                if (mods.length === 0) return null;
                return (
                  <Fragment key={section}>
                    <tr className="border-t border-[var(--border)] bg-[var(--slate-50)]">
                      <td colSpan={4} className="px-4 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">
                            {section}
                          </span>
                          <div className="flex items-center gap-1">
                            {(["MANAGE", "VIEW", "NONE"] as PermissionLevel[]).map((lv) => (
                              <button
                                key={lv}
                                type="button"
                                onClick={() => setSection(section, lv)}
                                disabled={!canManage}
                                className="rounded-md px-2 py-1 text-[0.7rem] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)] disabled:opacity-50"
                              >
                                {lv === "MANAGE" ? "Manage all" : lv === "VIEW" ? "View all" : "Clear"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                    {mods.map((m) => {
                      const current = (draft[m.id] ?? "NONE") as PermissionLevel;
                      return (
                        <tr key={m.id} className="border-t border-[var(--border)] transition-colors hover:bg-[var(--slate-50)]">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${
                                  current === "MANAGE"
                                    ? "bg-[var(--brand-600)] text-white"
                                    : current === "VIEW"
                                      ? "bg-[var(--brand-50)] text-[var(--brand-700)]"
                                      : "bg-[var(--slate-100)] text-[var(--slate-400)]"
                                }`}
                              >
                                <Icon name="Layers" size={14} />
                              </span>
                              <div className="min-w-0">
                                <div className="font-medium text-[var(--text)]">{m.label}</div>
                                <div className="truncate text-[0.72rem] text-[var(--text-subtle)]">{m.description}</div>
                              </div>
                            </div>
                          </td>
                          {LEVELS.map((lv) => (
                            <td key={lv} className="px-4 py-2.5 text-center">
                              <input
                                type="radio"
                                name={`perm-${m.id}`}
                                checked={current === lv}
                                disabled={!canManage}
                                onChange={() => setLevel(m.id, lv)}
                                aria-label={`${m.label} — ${LEVEL_LABEL[lv]}`}
                                className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                                style={{ accentColor: "var(--brand-600)" }}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Save bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3">
          <span className="text-[0.8rem] text-[var(--text-muted)]">
            {roleStats(role).reachable} modules granted currently
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => role && setDraft({ ...role.permissions })}
              disabled={!dirty || busy}
              className="btn-ghost h-9 px-4 text-[0.84rem] disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!canManage || !dirty || busy}
              className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[0.84rem] disabled:opacity-40"
            >
              <Icon name={busy ? "RefreshCw" : "Save"} size={15} className={busy ? "animate-spin" : ""} /> Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
