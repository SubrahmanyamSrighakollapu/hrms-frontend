"use client";

import { useEffect, useRef, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "./Avatar";
import {
  addMembers,
  getConversation,
  leaveGroup,
  listDirectory,
  removeMember,
  updateGroup,
  updateMemberRole,
  updateMemberSettings,
  uploadGroupAvatar,
  type ChatEmployee,
  type Conversation,
} from "@/lib/chat";

type GroupDetailsState =
  | { conversationId: string; status: "loaded"; conversation: Conversation }
  | { conversationId: string; status: "error" };

/** Group details: members, admin controls, mute/archive and leave. */
export function GroupInfoDrawer({
  open,
  conversation: conversationSummary,
  meId,
  onClose,
  onUpdated,
  onLeft,
}: {
  open: boolean;
  conversation: Conversation | null;
  meId: string | null;
  onClose: () => void;
  onUpdated: (conversation: Conversation) => void;
  onLeft: (conversationId: string) => void;
}) {
  const [detailsState, setDetailsState] = useState<GroupDetailsState | null>(null);
  const [initializedConversationId, setInitializedConversationId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [directory, setDirectory] = useState<ChatEmployee[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const avatarInput = useRef<HTMLInputElement>(null);

  if (conversationSummary && initializedConversationId !== conversationSummary.id) {
    setInitializedConversationId(conversationSummary.id);
    setName(conversationSummary.name);
    setDescription(conversationSummary.description ?? "");
    setEditing(false);
    setAdding(false);
    setPicked([]);
    setError(null);
  }

  useEffect(() => {
    if (!open || !conversationSummary?.isGroup) return;
    let active = true;
    getConversation(conversationSummary.id)
      .then((fullConversation) => {
        if (active) {
          setDetailsState({
            conversationId: conversationSummary.id,
            status: "loaded",
            conversation: fullConversation,
          });
        }
      })
      .catch((cause) => {
        if (active) {
          setDetailsState({ conversationId: conversationSummary.id, status: "error" });
          setError(cause instanceof Error ? cause.message : "Could not load group members");
        }
      });
    return () => {
      active = false;
    };
  }, [open, conversationSummary?.id, conversationSummary?.isGroup]);

  useEffect(() => {
    if (!open || !adding) return;
    let active = true;
    listDirectory()
      .then((list) => {
        if (active) setDirectory(list);
      })
      .catch(() => {
        if (active) setDirectory([]);
      });
    return () => {
      active = false;
    };
  }, [open, adding]);

  if (!conversationSummary) return null;
  const currentDetails =
    detailsState?.conversationId === conversationSummary.id ? detailsState : null;
  const conversation = currentDetails?.status === "loaded" ? currentDetails.conversation : conversationSummary;
  const loadingDetails = open && conversationSummary.isGroup && currentDetails === null;
  const isAdmin = conversation.myRole === "ADMIN";

  async function run(task: () => Promise<Conversation | void>, after?: () => void) {
    setBusy(true);
    setError(null);
    try {
      const result = await task();
      if (result) {
        setDetailsState({ conversationId: result.id, status: "loaded", conversation: result });
        onUpdated(result);
      }
      after?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const memberIds = new Set(conversation.members.map((m) => m.employeeId));
  const candidates = directory.filter((employee) => !memberIds.has(employee.id));

  return (
    <Drawer open={open} onClose={onClose} title="Group info" subtitle={`${conversation.memberCount} members`}>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar name={conversation.name} avatarUrl={conversation.avatarUrl} group size={56} />
            {isAdmin && (
              <>
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) run(() => uploadGroupAvatar(conversation.id, file));
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => avatarInput.current?.click()}
                  disabled={busy}
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] shadow-sm hover:text-[var(--text)]"
                  title="Change group photo"
                >
                  <Icon name="Image" size={13} />
                </button>
              </>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {editing ? (
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-base text-sm" />
            ) : (
              <h3 className="truncate text-[1rem] font-semibold text-[var(--text)]">{conversation.name}</h3>
            )}
            <p className="mt-0.5 text-[0.75rem] text-[var(--text-muted)]">
              {conversation.isGroup ? "Group chat" : "Direct message"}
            </p>
          </div>

          {isAdmin && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
              title="Edit group"
            >
              <Icon name="Pencil" size={16} />
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="input-base resize-none text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(false)} className="btn-ghost h-8 px-3 text-[0.8rem]">
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(
                    () => updateGroup(conversation.id, { name: name.trim(), description: description.trim() || null }),
                    () => setEditing(false),
                  )
                }
                className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[0.8rem] disabled:opacity-50"
              >
                {busy && <Icon name="LoaderCircle" size={13} className="animate-spin" />}
                Save
              </button>
            </div>
          </div>
        ) : (
          conversation.description && (
            <p className="rounded-lg bg-[var(--surface-2)] p-3 text-[0.8rem] leading-relaxed text-[var(--text-muted)]">
              {conversation.description}
            </p>
          )
        )}

        {error && (
          <p className="flex items-center gap-1.5 text-[0.78rem] text-[var(--danger)]">
            <Icon name="AlertCircle" size={14} /> {error}
          </p>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-[0.8rem] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Members</h4>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setAdding((a) => !a)}
                className="inline-flex items-center gap-1 text-[0.78rem] font-semibold text-[var(--brand-700)]"
              >
                <Icon name={adding ? "X" : "UserPlus"} size={14} />
                {adding ? "Cancel" : "Add"}
              </button>
            )}
          </div>

          {adding && (
            <div className="mb-3 rounded-lg border border-[var(--border)] p-2">
              <div className="max-h-40 space-y-0.5 overflow-y-auto">
                {candidates.length === 0 && (
                  <p className="py-3 text-center text-[0.76rem] text-[var(--text-muted)]">Everyone is already a member</p>
                )}
                {candidates.map((employee) => {
                  const isPicked = picked.includes(employee.id);
                  return (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() =>
                        setPicked((current) =>
                          current.includes(employee.id)
                            ? current.filter((x) => x !== employee.id)
                            : [...current, employee.id],
                        )
                      }
                      className={`flex w-full items-center gap-2 rounded-md p-1.5 text-left ${
                        isPicked ? "bg-[var(--brand-50)]" : "hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      <Avatar name={employee.name} avatarUrl={employee.avatarUrl} size={28} />
                      <span className="min-w-0 flex-1 truncate text-[0.8rem] text-[var(--text)]">{employee.name}</span>
                      {isPicked && <Icon name="Check" size={14} className="text-[var(--brand-600)]" />}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={busy || picked.length === 0}
                onClick={() => run(() => addMembers(conversation.id, picked), () => setPicked([]))}
                className="btn-primary mt-2 h-8 w-full text-[0.8rem] disabled:opacity-50"
              >
                Add {picked.length > 0 ? picked.length : ""} member{picked.length === 1 ? "" : "s"}
              </button>
            </div>
          )}

          <div className="space-y-0.5">
            {loadingDetails && (
              <p className="flex items-center justify-center gap-2 py-4 text-[0.76rem] text-[var(--text-muted)]">
                <Icon name="LoaderCircle" size={14} className="animate-spin" />
                Loading group members…
              </p>
            )}
            {!loadingDetails && conversation.members.map((member) => (
              <div key={member.employeeId} className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-[var(--surface-2)]">
                <Avatar
                  name={member.name}
                  avatarUrl={member.avatarUrl}
                  online={member.online}
                  showPresence
                  size={34}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[0.84rem] font-semibold text-[var(--text)]">{member.name}</span>
                    {member.employeeId === meId && (
                      <span className="badge badge-brand text-[0.62rem]">You</span>
                    )}
                  </div>
                  <div className="truncate text-[0.72rem] text-[var(--text-muted)]">
                    {member.designation ?? member.email}
                  </div>
                </div>
                {member.role === "ADMIN" && (
                  <span className="flex flex-shrink-0 items-center gap-1 text-[0.68rem] font-semibold text-[var(--warning)]">
                    <Icon name="Crown" size={12} /> {member.employeeId === conversation.createdById ? "Creator" : "Admin"}
                  </span>
                )}
                {isAdmin &&
                  member.employeeId !== meId &&
                  !(member.employeeId === conversation.createdById && member.role === "ADMIN" && meId !== conversation.createdById) && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        const nextRole = member.role === "ADMIN" ? "MEMBER" : "ADMIN";
                        if (
                          nextRole === "MEMBER" &&
                          !window.confirm(`Remove ${member.name}'s admin role?`)
                        ) {
                          return;
                        }
                        void run(() => updateMemberRole(conversation.id, member.employeeId, nextRole));
                      }}
                      className="flex h-7 items-center gap-1 rounded-md px-2 text-[0.68rem] font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                      title={member.role === "ADMIN" ? "Dismiss as admin" : "Make group admin"}
                      aria-label={member.role === "ADMIN" ? `Dismiss ${member.name} as admin` : `Make ${member.name} a group admin`}
                    >
                      <Icon name={member.role === "ADMIN" ? "ShieldHalf" : "Crown"} size={13} />
                      {member.role === "ADMIN" ? "Dismiss admin" : "Make admin"}
                    </button>
                  )}
                {isAdmin &&
                  member.employeeId !== meId &&
                  !(member.employeeId === conversation.createdById && meId !== conversation.createdById) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => removeMember(conversation.id, member.employeeId))}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-subtle)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                    title="Remove from group"
                  >
                    <Icon name="UserMinus" size={15} />
                  </button>
                  )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1 border-t border-[var(--border)] pt-4">
          <ToggleRow
            icon={conversation.isMuted ? "BellOff" : "Bell"}
            label={conversation.isMuted ? "Unmute notifications" : "Mute notifications"}
            onClick={() => run(() => updateMemberSettings(conversation.id, { isMuted: !conversation.isMuted }))}
          />
          <ToggleRow
            icon="Archive"
            label={conversation.isArchived ? "Unarchive conversation" : "Archive conversation"}
            onClick={() => run(() => updateMemberSettings(conversation.id, { isArchived: !conversation.isArchived }))}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(
                () => leaveGroup(conversation.id),
                () => {
                  onLeft(conversation.id);
                  onClose();
                },
              )
            }
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[0.84rem] font-medium text-[var(--danger)] transition-colors hover:bg-[var(--danger-bg)]"
          >
            <Icon name="LogOut" size={16} /> Leave conversation
          </button>
        </div>
      </div>
    </Drawer>
  );
}

function ToggleRow({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[0.84rem] font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-2)]"
    >
      <Icon name={icon} size={16} className="text-[var(--text-muted)]" />
      {label}
    </button>
  );
}
