"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Tabs } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { TablePagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import type {
  CreateTicketInput,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStats,
  TicketStatus,
  UpdateTicketInput,
} from "@/lib/ticket-types";
import type { TicketQuery } from "@/lib/tickets";

const PRIORITY_ORDER: TicketPriority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];
const STATUS_ORDER: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const PRIORITY_TONE: Record<TicketPriority, "danger" | "warning" | "info" | "muted"> = {
  URGENT: "danger",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "muted",
};

const STATUS_TONE: Record<TicketStatus, "info" | "warning" | "success" | "muted"> = {
  OPEN: "info",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "muted",
};

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

interface TicketClient {
  listCategories: () => Promise<TicketCategory[]>;
  listTickets: (query?: TicketQuery) => Promise<{ tickets: Ticket[]; total: number; page: number; pageSize: number; totalPages: number }>;
  getTicket: (id: string) => Promise<Ticket>;
  createTicket: (input: CreateTicketInput) => Promise<Ticket>;
  updateTicket: (id: string, input: UpdateTicketInput) => Promise<Ticket>;
  addComment: (id: string, message: string) => Promise<unknown>;
  getStats: () => Promise<TicketStats>;
  listAssignees: () => Promise<{ id: string; name: string | null; email: string; designation: string | null }[]>;
}

interface ModuleConfig {
  moduleId: string;
  title: string;
  subtitle: string;
  client: TicketClient;
}

type Scope = "mine" | "all" | "assigned";

const EMPTY_FORM: CreateTicketInput = {
  title: "",
  description: "",
  categoryId: "",
  priority: "MEDIUM",
};

export function TicketModulePage({ moduleId, title, subtitle, client }: ModuleConfig) {
  const { can } = useAuth();
  const toast = useToast();
  const canManage = can(moduleId, "MANAGE");

  const [scope, setScope] = useState<Scope>("mine");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [assignees, setAssignees] = useState<{ id: string; name: string | null; email: string }[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selected, setSelected] = useState<Ticket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateTicketInput>(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: TicketQuery = { scope: canManage ? scope : "mine", page, pageSize };
      if (statusFilter) query.status = statusFilter;
      if (priorityFilter) query.priority = priorityFilter;
      if (categoryFilter) query.categoryId = categoryFilter;

      const [list, cats, s] = await Promise.all([
        client.listTickets(query),
        client.listCategories(),
        client.getStats().catch(() => null),
      ]);
      setTickets(list.tickets);
      setTotal(list.total);
      setTotalPages(list.totalPages);
      setCategories(cats);
      setStats(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [client, scope, statusFilter, priorityFilter, categoryFilter, canManage, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadAssignees = useCallback(async () => {
    try {
      const list = await client.listAssignees();
      setAssignees(list);
    } catch {
      /* ignore */
    }
  }, [client]);

  useEffect(() => {
    if (canManage) void loadAssignees();
  }, [canManage, loadAssignees]);

  const openDetail = async (ticket: Ticket) => {
    setSelected(ticket);
    setDetailLoading(true);
    try {
      const full = await client.getTicket(ticket.id);
      setSelected(full);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load ticket");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = () => {
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? "" });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.categoryId) return toast.error("Category is required");
    if (!form.description.trim()) return toast.error("Description is required");
    setSaving(true);
    try {
      await client.createTicket(form);
      toast.success("Ticket created");
      setModalOpen(false);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create ticket");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (patch: UpdateTicketInput) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const updated = await client.updateTicket(selected.id, patch);
      setSelected({ ...selected, ...updated });
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      toast.success("Ticket updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update ticket");
    } finally {
      setUpdating(false);
    }
  };

  const handleComment = async () => {
    if (!selected || !commentText.trim()) return;
    setCommenting(true);
    try {
      await client.addComment(selected.id, commentText.trim());
      setCommentText("");
      const full = await client.getTicket(selected.id);
      setSelected(full);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add comment");
    } finally {
      setCommenting(false);
    }
  };

  const tabs = useMemo(() => {
    const base = [{ id: "mine", label: "My Tickets" }];
    if (canManage) base.push({ id: "all", label: "All Tickets" }, { id: "assigned", label: "Assigned to me" });
    return base;
  }, [canManage]);

  const statusCounts = stats?.byStatus ?? ({} as Record<TicketStatus, number>);

  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <button className="btn-primary inline-flex items-center gap-2 h-9 px-3" onClick={handleCreate}>
            <Icon name="Plus" size={16} /> New Ticket
          </button>
        }
      />

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="card p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">{STATUS_LABEL[s]}</div>
                <div className="text-2xl font-bold text-[var(--text)] mt-0.5">{statusCounts[s] ?? 0}</div>
              </div>
              <Badge tone={STATUS_TONE[s]}>{STATUS_LABEL[s]}</Badge>
            </div>
          ))}
        </div>
      )}

      {error && <div className="card p-4 text-sm text-[var(--danger)]">{error}</div>}

      <Tabs tabs={tabs} initial={scope} onChange={(id) => { setPage(1); setScope(id as Scope); }} />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }} className="h-9 text-sm w-36">
          <option value="">All statuses</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </Select>
        <Select value={priorityFilter} onChange={(e) => { setPage(1); setPriorityFilter(e.target.value); }} className="h-9 text-sm w-32">
          <option value="">All priorities</option>
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
          ))}
        </Select>
        <Select value={categoryFilter} onChange={(e) => { setPage(1); setCategoryFilter(e.target.value); }} className="h-9 text-sm w-40">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading tickets…</div>
      ) : (
        <div className="card overflow-hidden">
          {tickets.length === 0 ? (
            <div className="p-10 text-center text-sm text-[var(--text-muted)]">
              No tickets found. Create one to get started.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openDetail(t)}
                  className="w-full text-left flex items-center gap-4 p-4 hover:bg-[var(--surface-2)]/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[var(--text)] truncate">{t.title}</span>
                      <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                      <Badge tone={PRIORITY_TONE[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                      <span>#{t.id.slice(0, 8)}</span>
                      <span>{t.categoryName}</span>
                      {t.assignedToName && <span>→ {t.assignedToName}</span>}
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-[var(--text-muted)] flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            loading={loading}
            label="tickets"
          />
        </div>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? "Ticket"}
        subtitle={selected ? `#${selected.id.slice(0, 8)}` : undefined}
        size="lg"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[selected.status]}>{STATUS_LABEL[selected.status]}</Badge>
              <Badge tone={PRIORITY_TONE[selected.priority]}>{PRIORITY_LABEL[selected.priority]}</Badge>
              <Badge tone="muted">{selected.categoryName}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Reported by</div>
                <div className="font-medium text-[var(--text)] mt-0.5">{selected.createdByName ?? selected.createdByEmail}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Assigned to</div>
                <div className="font-medium text-[var(--text)] mt-0.5">{selected.assignedToName ?? "Unassigned"}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Created</div>
                <div className="font-medium text-[var(--text)] mt-0.5">{new Date(selected.createdAt).toLocaleString()}</div>
              </div>
              {selected.resolvedAt && (
                <div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Resolved</div>
                  <div className="font-medium text-[var(--text)] mt-0.5">{new Date(selected.resolvedAt).toLocaleString()}</div>
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Description</div>
              <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{selected.description}</p>
            </div>

            {canManage && (
              <div className="card p-4 space-y-4">
                <div className="text-sm font-semibold text-[var(--text)]">Manage ticket</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Status" htmlFor="t-status">
                    <Select
                      id="t-status"
                      value={selected.status}
                      disabled={updating}
                      onChange={(e) => handleUpdate({ status: e.target.value as TicketStatus })}
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Priority" htmlFor="t-priority">
                    <Select
                      id="t-priority"
                      value={selected.priority}
                      disabled={updating}
                      onChange={(e) => handleUpdate({ priority: e.target.value as TicketPriority })}
                    >
                      {PRIORITY_ORDER.map((p) => (
                        <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="Assignee" htmlFor="t-assignee">
                  <Select
                    id="t-assignee"
                    value={selected.assignedToId ?? ""}
                    disabled={updating}
                    onChange={(e) => handleUpdate({ assignedToId: e.target.value || null })}
                  >
                    <option value="">Unassigned</option>
                    {assignees.map((a) => (
                      <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            )}

            <div>
              <div className="text-sm font-semibold text-[var(--text)] mb-3">Comments</div>
              <div className="space-y-3">
                {selected.comments && selected.comments.length > 0 ? (
                  selected.comments.map((c) => (
                    <div key={c.id} className="card p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[var(--text)]">{c.userName ?? c.userEmail}</span>
                        <span className="text-xs text-[var(--text-muted)]">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{c.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">No comments yet.</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment…"
                  rows={2}
                  disabled={commenting}
                />
                <button
                  className="btn-primary h-auto px-3 self-start"
                  disabled={commenting || !commentText.trim()}
                  onClick={handleComment}
                >
                  {commenting ? "…" : <Icon name="Send" size={16} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Ticket"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost h-9 px-4" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary h-9 px-4" disabled={saving} onClick={handleSave}>
              {saving ? "Creating…" : "Create"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required htmlFor="t-title">
            <Input
              id="t-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Brief summary of the issue"
              maxLength={150}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" required htmlFor="t-category">
              <Select
                id="t-category"
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Priority" htmlFor="t-priority">
              <Select
                id="t-priority"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TicketPriority }))}
              >
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Description" required htmlFor="t-desc">
            <Textarea
              id="t-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              placeholder="Describe the issue in detail"
              maxLength={4000}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
