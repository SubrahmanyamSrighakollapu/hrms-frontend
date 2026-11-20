"use client";

import { api } from "@/lib/api";

export interface Payslip {
  id: string;
  employeeId: string;
  employeeCode: string | null;
  employeeName: string;
  employeeEmail: string;
  payrollPeriod: string;
  originalFilename: string;
  fileSize: number;
  uploadedAt: string;
}

export interface PayslipListResult {
  payslips: Payslip[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PayslipUploadResult {
  filename: string;
  employeeCode: string | null;
  employeeName?: string;
  status: "UPLOADED" | "REJECTED";
  reason?: string;
}

export interface PayslipBatchResult {
  payrollPeriod: string;
  uploaded: number;
  rejected: number;
  results: PayslipUploadResult[];
}

export interface PayslipListParams {
  payrollPeriod?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export function listPayslips(params: PayslipListParams = {}): Promise<PayslipListResult> {
  const query = new URLSearchParams();
  if (params.payrollPeriod) query.set("payrollPeriod", params.payrollPeriod);
  if (params.q) query.set("q", params.q);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const suffix = query.size ? `?${query.toString()}` : "";
  return api.get<PayslipListResult>(`/payroll/payslips${suffix}`);
}

export function uploadPayslips(payrollPeriod: string, files: File[]): Promise<PayslipBatchResult> {
  const form = new FormData();
  form.set("payrollPeriod", payrollPeriod);
  files.forEach((file) => form.append("files", file));
  return api.upload<PayslipBatchResult>("/payroll/payslips/bulk", form);
}

export function downloadPayslip(id: string): Promise<Blob> {
  return api.download(`/payroll/payslips/${encodeURIComponent(id)}/download`);
}
