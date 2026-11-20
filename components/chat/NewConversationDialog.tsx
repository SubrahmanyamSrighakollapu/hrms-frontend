"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "./Avatar";
import {
  createDirect,
  createGroup,
  listDirectory,
  type ChatEmployee,
  type Conversation,
} from "@/lib/chat";

type Mode = "direct" | "group";

/** Directory picker that opens a one-to-one chat or creates a group. */
export function NewConversationDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (conversation: Conversation) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="New conversation" description="Start a direct chat or create a group.">
      <NewConversationPanel onClose={onClose} onCreated={onCreated} />
    </Modal>
  );
}

/** Mounted only while the dialog is open, so its state starts fresh each time. */
function NewConversationPanel({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (conversation: Conversation) => void;
}) {
  const [mode, setMode] = useState<Mode>("direct");
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState<ChatEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const handle = window.setTimeout(() => {
      setLoading(true);
      listDirectory(query.trim() || undefined)
        .then((list) => {
          if (active) setEmployees(list);
        })
        .catch((e) => {
          if (active) setError(e instanceof Error ? e.message : "Failed to load directory");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(handle);
    };
  }, [query]);

  function toggle(id: string) {
    setSelected((current) => {
      if (mode === "direct") return current[0] === id ? [] : [id];
      return current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    });
  }

  async function submit() {
    setError(null);
    if (selected.length === 0) {
      setError("Select at least one colleague");
      return;
    }
    if (mode === "group" && !name.trim()) {
      setError("Give the group a name");
      return;
    }
    setSaving(true);
    try {
      const conversation =
        mode === "direct"
          ? await createDirect(selected[0])
          : await createGroup({ name: name.trim(), description: description.trim() || null, memberIds: selected });
      onCreated(conversation);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the conversation");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-3 flex rounded-lg bg-[var(--surface-2)] p-0.5">
        {(["direct", "group"] as Mode[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setSelected([]);
              setError(null);
            }}
            className={`flex-1 rounded-md py-1.5 text-[0.8rem] font-semibold transition-colors ${
              mode === value ? "bg-[var(--surface)] text-[var(--brand-700)] shadow-[var(--shadow-xs)]" : "text-[var(--text-muted)]"
            }`}
          >
            {value === "direct" ? "Direct message" : "Group"}
          </button>
        ))}
      </div>

      {mode === "group" && (
        <div className="mb-3 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="input-base text-sm"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="input-base text-sm"
          />
        </div>
      )}

      <div className="relative mb-2">
        <Icon
          name="Search"
          size={15}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people…"
          className="input-base input-base--leading-icon py-2 text-sm"
        />
      </div>

      <div className="max-h-64 space-y-0.5 overflow-y-auto">
        {loading && employees.length === 0 && (
          <div className="flex justify-center py-6 text-[var(--text-subtle)]">
            <Icon name="LoaderCircle" size={18} className="animate-spin" />
          </div>
        )}
        {!loading && employees.length === 0 && (
          <p className="py-6 text-center text-[0.8rem] text-[var(--text-muted)]">No colleagues found</p>
        )}
        {employees.map((employee) => {
          const isSelected = selected.includes(employee.id);
          return (
            <button
              key={employee.id}
              type="button"
              onClick={() => toggle(employee.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors ${
                isSelected ? "bg-[var(--brand-50)]" : "hover:bg-[var(--surface-2)]"
              }`}
            >
              <Avatar name={employee.name} avatarUrl={employee.avatarUrl} online={employee.online} showPresence size={34} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[0.84rem] font-semibold text-[var(--text)]">{employee.name}</div>
                <div className="truncate text-[0.72rem] text-[var(--text-muted)]">
                  {employee.designation ?? employee.email}
                </div>
              </div>
              <span
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border ${
                  isSelected ? "border-[var(--brand-600)] bg-[var(--brand-600)] text-white" : "border-[var(--border-strong)]"
                }`}
              >
                {isSelected && <Icon name="Check" size={13} />}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-[0.78rem] text-[var(--danger)]">
          <Icon name="AlertCircle" size={14} /> {error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button type="button" onClick={onClose} className="btn-ghost h-9 px-3.5 text-[0.83rem]">
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="btn-primary inline-flex h-9 items-center gap-1.5 px-4 text-[0.83rem] disabled:opacity-50"
        >
          {saving && <Icon name="LoaderCircle" size={14} className="animate-spin" />}
          {mode === "direct" ? "Start chat" : "Create group"}
        </button>
      </div>
    </>
  );
}
