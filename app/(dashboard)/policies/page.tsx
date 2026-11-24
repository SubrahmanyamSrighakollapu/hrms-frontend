"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Tabs } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { TablePagination, useClientPagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import {
  acknowledgePolicy,
  createPolicy,
  deletePolicy,
  downloadPolicy,
  getPolicy,
  getTeamAcknowledgments,
  listPolicies,
  publishPolicy,
  updatePolicy,
  type Policy,
  type PolicyInput,
  type PolicyStatus,
  type TeamAcknowledgments,
} from "@/lib/policies";

const EMPTY_FORM: PolicyInput = {
  title: "",
  description: "",
  category: "",
  effectiveDate: "",
  status: "DRAFT",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PoliciesPage() {
  const { can } = useAuth();
  const toast = useToast();
  const canManage = can("policies", "MANAGE");

  const [tab, setTab] = useState<"all" | "team">("all");
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [team, setTeam] = useState<TeamAcknowledgments | null>(null);
  const [hasReports, setHasReports] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Policy | null>(null);
  const [form, setForm] = useState<PolicyInput>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [deleting, setDeleting] = useState<Policy | null>(null);

  const [detail, setDetail] = useState<Policy | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyAck, setBusyAck] = useState<string | null>(null);
  const [busyDownload, setBusyDownload] = useState<string | null>(null);

  const pag = useClientPagination(policies, 10);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, teamData] = await Promise.all([
        listPolicies(),
        getTeamAcknowledgments().catch(() => null),
      ]);
      setPolicies(list);
      setTeam(teamData);
      setHasReports(!!teamData && teamData.reports.length > 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load policies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tabs = useMemo(
    () => [
      { id: "all", label: canManage ? "All Policies" : "Policies" },
      ...(hasReports ? [{ id: "team", label: "Team Acknowledgments" }] : []),
    ],
    [canManage, hasReports],
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFile(null);
    setModalOpen(true);
  };

  const openEdit = (p: Policy) => {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description ?? "",
      category: p.category ?? "",
      effectiveDate: p.effectiveDate ? p.effectiveDate.slice(0, 10) : "",
      status: p.status,
    });
    setFile(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!editing && !file) {
      toast.error("A policy document is required");
      return;
    }
    setSaving(true);
    try {
      const payload: PolicyInput = {
        ...form,
        description: form.description || undefined,
        category: form.category || undefined,
        effectiveDate: form.effectiveDate || undefined,
        document: file ?? undefined,
      };
      if (editing) {
        await updatePolicy(editing.id, payload);
        toast.success("Policy updated");
      } else {
        await createPolicy(payload);
        toast.success("Policy created");
      }
      setModalOpen(false);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deletePolicy(deleting.id);
      toast.success("Policy deleted");
      setDeleting(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete policy");
    }
  };

  const handlePublish = async (p: Policy) => {
    try {
      await publishPolicy(p.id);
      toast.success("Policy published");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to publish");
    }
  };

  const handleAcknowledge = async (p: Policy) => {
    setBusyAck(p.id);
    try {
      await acknowledgePolicy(p.id);
      toast.success("Acknowledgment recorded");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to acknowledge");
    } finally {
      setBusyAck(null);
    }
  };

  const handleDownload = async (p: Policy) => {
    setBusyDownload(p.id);
    try {
      const blob = await downloadPolicy(p.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = p.originalFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusyDownload(null);
    }
  };

  const openDetail = async (p: Policy) => {
    setDetailLoading(true);
    setDetail(p);
    try {
      const full = await getPolicy(p.id);
      setDetail(full);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load policy");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Policies"
        subtitle="Company policies and acknowledgments"
        actions={
          canManage ? (
            <button className="btn-primary inline-flex items-center gap-2 h-9 px-3" onClick={openCreate}>
              <Icon name="Plus" size={16} /> New policy
            </button>
          ) : null
        }
      />

      {error && <div className="card p-4 text-sm text-[var(--danger)]">{error}</div>}

      <Tabs tabs={tabs} initial={tab} onChange={(id) => setTab(id as typeof tab)} />

      <div className="mt-5">
        {loading ? (
          <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading policies…</div>
        ) : tab === "team" ? (
          <TeamAcknowledgmentsView team={team} />
        ) : policies.length === 0 ? (
          <div className="card p-10 text-center text-sm text-[var(--text-muted)]">
            No policies found.
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-2)] text-[var(--text-muted)] text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Policy</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Version</th>
                  <th className="text-left px-4 py-3 font-medium">Effective</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  {canManage && <th className="text-left px-4 py-3 font-medium">Acks</th>}
                  {!canManage && <th className="text-left px-4 py-3 font-medium">Acknowledged</th>}
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {pag.pageItems.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text)]">{p.title}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">
                        {p.originalFilename} · {formatBytes(p.fileSize)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{p.category ?? "—"}</td>
                    <td className="px-4 py-3">v{p.version}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {p.effectiveDate ? new Date(p.effectiveDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.status === "PUBLISHED" ? "success" : "muted"}>
                        {p.status === "PUBLISHED" ? "Published" : "Draft"}
                      </Badge>
                    </td>
                    {canManage ? (
                      <td className="px-4 py-3">{p.acknowledgmentCount}</td>
                    ) : (
                      <td className="px-4 py-3">
                        {p.acknowledged ? (
                          <Badge tone="success">Acknowledged</Badge>
                        ) : (
                          <Badge tone="warning">Pending</Badge>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn-ghost h-8 px-2 text-xs"
                          onClick={() => openDetail(p)}
                          title="View details"
                        >
                          <Icon name="Eye" size={15} />
                        </button>
                        <button
                          className="btn-ghost h-8 px-2 text-xs"
                          onClick={() => handleDownload(p)}
                          disabled={busyDownload === p.id}
                          title="Download"
                        >
                          <Icon name="Download" size={15} />
                        </button>
                        {!canManage && (
                          <button
                            className={
                              p.acknowledged
                                ? "btn-ghost h-8 px-3 text-xs"
                                : "btn-primary h-8 px-3 text-xs"
                            }
                            onClick={() => handleAcknowledge(p)}
                            disabled={p.acknowledged || busyAck === p.id}
                          >
                            {busyAck === p.id
                              ? "…"
                              : p.acknowledged
                                ? "Acknowledged"
                                : "Acknowledge"}
                          </button>
                        )}
                        {canManage && (
                          <>
                            {p.status === "DRAFT" && (
                              <button
                                className="btn-primary h-8 px-3 text-xs"
                                onClick={() => handlePublish(p)}
                              >
                                Publish
                              </button>
                            )}
                            <button
                              className="btn-ghost h-8 w-8 p-0"
                              onClick={() => openEdit(p)}
                              title="Edit"
                            >
                              <Icon name="Pencil" size={15} />
                            </button>
                            <button
                              className="btn-ghost h-8 w-8 p-0 text-[var(--danger)]"
                              onClick={() => setDeleting(p)}
                              title="Delete"
                            >
                              <Icon name="Trash2" size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination
              page={pag.page}
              pageSize={pag.pageSize}
              total={pag.total}
              totalPages={pag.totalPages}
              onPageChange={pag.setPage}
              onPageSizeChange={pag.setPageSize}
              label="policies"
            />
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit policy" : "New policy"}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost h-9 px-4" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary h-9 px-4" disabled={saving} onClick={handleSave}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required htmlFor="p-title">
            <Input
              id="p-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Leave & Time Off Policy"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" htmlFor="p-category">
              <Input
                id="p-category"
                value={form.category ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. HR, Finance"
              />
            </Field>
            <Field label="Effective date" htmlFor="p-effective">
              <Input
                id="p-effective"
                type="date"
                value={form.effectiveDate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Description" htmlFor="p-desc">
            <Textarea
              id="p-desc"
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Brief summary of the policy"
            />
          </Field>
          <Field label="Status" htmlFor="p-status">
            <Select
              id="p-status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PolicyStatus }))}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </Select>
          </Field>
          <Field label={editing ? "Replace document (optional)" : "Document"} required={!editing} htmlFor="p-file">
            <Input
              id="p-file"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {editing && (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Current: {editing.originalFilename}
              </p>
            )}
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete policy"
        icon="Trash2"
        tone="danger"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost h-9 px-4" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button className="btn-danger h-9 px-4" onClick={handleDelete}>
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">
          Delete <span className="font-semibold text-[var(--text)]">{deleting?.title}</span>? This
          cannot be undone.
        </p>
      </Modal>

      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title ?? "Policy"}
        subtitle={detail ? `v${detail.version} · ${detail.category ?? "General"}` : undefined}
        footer={
          detail ? (
            <div className="flex justify-between items-center">
              <div className="text-xs text-[var(--text-muted)]">
                {detail.acknowledgedAt
                  ? `Acknowledged on ${new Date(detail.acknowledgedAt).toLocaleDateString()}`
                  : detail.acknowledged
                    ? "Acknowledged"
                    : "Not yet acknowledged"}
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-ghost h-9 px-4"
                  onClick={() => detail && handleDownload(detail)}
                >
                  <Icon name="Download" size={15} className="mr-1.5" />
                  Download
                </button>
                {!canManage && !detail.acknowledged && (
                  <button
                    className="btn-primary h-9 px-4"
                    onClick={() => detail && handleAcknowledge(detail)}
                    disabled={busyAck === detail.id}
                  >
                    {busyAck === detail.id ? "…" : "Acknowledge"}
                  </button>
                )}
              </div>
            </div>
          ) : null
        }
      >
        {detailLoading || !detail ? (
          <div className="text-sm text-[var(--text-muted)]">Loading…</div>
        ) : (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">
                  Status
                </div>
                <Badge tone={detail.status === "PUBLISHED" ? "success" : "muted"}>
                  {detail.status === "PUBLISHED" ? "Published" : "Draft"}
                </Badge>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">
                  Effective date
                </div>
                <div className="text-[var(--text)]">
                  {detail.effectiveDate
                    ? new Date(detail.effectiveDate).toLocaleDateString()
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">
                  Created by
                </div>
                <div className="text-[var(--text)]">{detail.createdByName ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">
                  Last updated
                </div>
                <div className="text-[var(--text)]">
                  {new Date(detail.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">
                Document
              </div>
              <div className="flex items-center gap-2 text-[var(--text)]">
                <Icon name="FileText" size={16} />
                <span>{detail.originalFilename}</span>
                <span className="text-[var(--text-muted)]">({formatBytes(detail.fileSize)})</span>
              </div>
            </div>
            {detail.description && (
              <div>
                <div className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">
                  Description
                </div>
                <p className="text-[var(--text)] whitespace-pre-wrap">{detail.description}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

function TeamAcknowledgmentsView({ team }: { team: TeamAcknowledgments | null }) {
  const rows = team?.acknowledgments ?? [];
  const pag = useClientPagination(rows, 10);
  if (!team || team.reports.length === 0) {
    return (
      <div className="card p-10 text-center text-sm text-[var(--text-muted)]">
        No direct reports.
      </div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-2)] text-[var(--text-muted)] text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Employee</th>
            <th className="text-left px-4 py-3 font-medium">Policy</th>
            <th className="text-left px-4 py-3 font-medium">Acknowledged on</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-[var(--text-muted)]">
                No policy acknowledgments from your team yet.
              </td>
            </tr>
          ) : (
            pag.pageItems.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-medium">{a.employee.name}</td>
                <td className="px-4 py-3">{a.policyTitle}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {new Date(a.acknowledgedAt).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <TablePagination
        page={pag.page}
        pageSize={pag.pageSize}
        total={pag.total}
        totalPages={pag.totalPages}
        onPageChange={pag.setPage}
        onPageSizeChange={pag.setPageSize}
        label="acknowledgments"
      />
    </div>
  );
}
