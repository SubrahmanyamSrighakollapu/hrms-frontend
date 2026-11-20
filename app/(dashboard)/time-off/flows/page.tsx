"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { useRbac } from "@/lib/rbac";
import {
  REQUEST_TYPE_ICON,
  REQUEST_TYPE_LABEL,
  updateApprovalFlow,
  useApprovalFlows,
  type ApprovalFlow,
  type TimeOffRequestType,
} from "@/lib/timeoff";

/**
 * Admin configuration: which role approves each time-off request type.
 * Changing a role re-routes all *new* requests of that type to it; existing
 * pending requests keep their originally assigned approver role.
 */
export default function ApprovalFlowsPage() {
  const toast = useToast();
  const { roles } = useRbac();
  const { flows, loading, error, refresh } = useApprovalFlows(true);

  const [busyType, setBusyType] = useState<TimeOffRequestType | null>(null);

  // Re-fetch once roles are available so the dropdowns reflect the full list.
  useEffect(() => {
    if (roles.length > 0 && !flows) refresh();
  }, [roles.length, flows, refresh]);

  const handleChange = async (requestType: TimeOffRequestType, approverRoleId: string) => {
    setBusyType(requestType);
    try {
      await updateApprovalFlow(requestType, approverRoleId);
      const role = roles.find((r) => r.id === approverRoleId);
      toast.success(
        `${REQUEST_TYPE_LABEL[requestType]} requests will now be approved by ${role?.name ?? "the selected role"}.`,
      );
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the approval flow.");
    } finally {
      setBusyType(null);
    }
  };

  const typeOrder: TimeOffRequestType[] = ["LEAVE", "PERMISSION", "REGULARIZATION", "EXTRA_HOURS"];
  const flowByType = new Map((flows ?? []).map((f) => [f.requestType, f]));

  return (
    <div>
      <div className="card mb-4 flex items-start gap-3 p-4">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--brand-50)] text-[var(--brand-700)]">
          <Icon name="ShieldCheck" size={17} />
        </span>
        <div className="text-sm">
          <p className="font-medium text-[var(--text)]">Approval routing</p>
          <p className="mt-0.5 text-[0.82rem] text-[var(--text-muted)]">
            Choose which role can approve each request type. Only members of that role with{" "}
            <b>Time Off → Manage</b> access will see the requests in their inbox. Changing this
            affects new requests only; pending requests keep their current approver.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] px-3.5 py-2.5 text-[0.82rem] text-[var(--danger)]">
          <Icon name="AlertCircle" size={15} /> {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--slate-50)]">
              <tr className="text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Request type</th>
                <th className="px-4 py-3 font-medium">Approver role</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                    Loading approval flows…
                  </td>
                </tr>
              )}

              {!loading &&
                typeOrder.map((type) => {
                  const flow: ApprovalFlow | undefined = flowByType.get(type);
                  return (
                    <tr key={type} className="border-t border-[var(--border)]">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 font-medium text-[var(--text)]">
                          <Icon name={REQUEST_TYPE_ICON[type]} size={15} className="text-[var(--brand-600)]" />
                          {REQUEST_TYPE_LABEL[type]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={flow?.approverRoleId ?? ""}
                          onChange={(e) => handleChange(type, e.target.value)}
                          disabled={busyType === type || roles.length === 0}
                          className="input-base w-auto py-1.5 text-[0.84rem] font-medium disabled:opacity-60"
                        >
                          {roles.length === 0 && <option value="">Loading roles…</option>}
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {busyType === type ? (
                          <Badge tone="warning">Saving…</Badge>
                        ) : flow ? (
                          <Badge tone="success">Configured</Badge>
                        ) : (
                          <Badge tone="muted">Default (HR)</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
