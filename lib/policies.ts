import { api } from "@/lib/api";

export type PolicyStatus = "DRAFT" | "PUBLISHED";

export interface Policy {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  documentPath: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  status: PolicyStatus;
  effectiveDate: string | null;
  version: number;
  createdById: string;
  createdByName: string | null;
  acknowledgmentCount: number;
  acknowledged?: boolean;
  acknowledgedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyInput {
  title: string;
  description?: string;
  category?: string;
  effectiveDate?: string;
  status?: PolicyStatus;
  document?: File;
}

export interface TeamAcknowledgment {
  id: string;
  policyId: string;
  policyTitle: string;
  employee: { id: string; name: string; email: string };
  acknowledgedAt: string;
}

export interface TeamAcknowledgments {
  reports: { id: string; name: string; email: string }[];
  acknowledgments: TeamAcknowledgment[];
}

export async function listPolicies(params?: { status?: PolicyStatus; category?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);
  const qs = query.toString();
  const result = await api.get<{ policies: Policy[] }>(`/policies${qs ? `?${qs}` : ""}`);
  return result.policies;
}

export async function getPolicy(id: string): Promise<Policy> {
  const result = await api.get<{ policy: Policy }>(`/policies/${id}`);
  return result.policy;
}

export async function createPolicy(input: PolicyInput): Promise<Policy> {
  const form = new FormData();
  form.append("title", input.title);
  if (input.description) form.append("description", input.description);
  if (input.category) form.append("category", input.category);
  if (input.effectiveDate) form.append("effectiveDate", input.effectiveDate);
  if (input.status) form.append("status", input.status);
  if (input.document) form.append("document", input.document);
  const result = await api.upload<{ policy: Policy }>("/policies", form);
  return result.policy;
}

export async function updatePolicy(id: string, input: PolicyInput): Promise<Policy> {
  const form = new FormData();
  form.append("title", input.title);
  if (input.description !== undefined) form.append("description", input.description || "");
  if (input.category !== undefined) form.append("category", input.category || "");
  if (input.effectiveDate !== undefined)
    form.append("effectiveDate", input.effectiveDate || "");
  if (input.status) form.append("status", input.status);
  if (input.document) form.append("document", input.document);
  const result = await api.upload<{ policy: Policy }>(`/policies/${id}`, form);
  return result.policy;
}

export async function deletePolicy(id: string): Promise<void> {
  await api.del(`/policies/${id}`);
}

export async function publishPolicy(id: string): Promise<Policy> {
  const result = await api.patch<{ policy: Policy }>(`/policies/${id}/publish`, {});
  return result.policy;
}

export async function downloadPolicy(id: string): Promise<Blob> {
  return api.download(`/policies/${id}/download`);
}

export async function acknowledgePolicy(id: string) {
  return api.post<{ acknowledgment: { id: string; acknowledgedAt: string } }>(
    `/policies/${id}/acknowledge`,
    {},
  );
}

export async function getTeamAcknowledgments(policyId?: string): Promise<TeamAcknowledgments> {
  const qs = policyId ? `?policyId=${encodeURIComponent(policyId)}` : "";
  return api.get<TeamAcknowledgments>(`/policies/team${qs}`);
}
