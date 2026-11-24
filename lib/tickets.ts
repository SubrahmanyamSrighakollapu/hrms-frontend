import { api } from "@/lib/api";
import type {
  Assignee,
  CreateTicketInput,
  Ticket,
  TicketCategory,
  TicketComment,
  TicketListResult,
  TicketStats,
  UpdateTicketInput,
} from "./ticket-types";

export interface TicketQuery {
  status?: string;
  priority?: string;
  categoryId?: string;
  scope?: "all" | "mine" | "assigned";
  page?: number;
  pageSize?: number;
}

export function createTicketClient(basePath: string) {
  const listCategories = async (): Promise<TicketCategory[]> => {
    const result = await api.get<{ categories: TicketCategory[] }>(`${basePath}/categories`);
    return result.categories;
  };

  const listAllCategories = async (): Promise<TicketCategory[]> => {
    const result = await api.get<{ categories: TicketCategory[] }>(`${basePath}/categories/all`);
    return result.categories;
  };

  const createCategory = async (name: string, icon?: string): Promise<TicketCategory> => {
    const result = await api.post<{ category: TicketCategory }>(`${basePath}/categories`, { name, icon });
    return result.category;
  };

  const updateCategory = async (
    id: string,
    data: { name?: string; icon?: string; active?: boolean },
  ): Promise<TicketCategory> => {
    const result = await api.patch<{ category: TicketCategory }>(`${basePath}/categories/${id}`, data);
    return result.category;
  };

  const listTickets = async (query: TicketQuery = {}): Promise<TicketListResult> => {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.priority) params.set("priority", query.priority);
    if (query.categoryId) params.set("categoryId", query.categoryId);
    if (query.scope) params.set("scope", query.scope);
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    const qs = params.toString();
    return api.get<TicketListResult>(`${basePath}${qs ? `?${qs}` : ""}`);
  };

  const getTicket = async (id: string): Promise<Ticket> => {
    const result = await api.get<{ ticket: Ticket }>(`${basePath}/${id}`);
    return result.ticket;
  };

  const createTicket = async (input: CreateTicketInput): Promise<Ticket> => {
    const result = await api.post<{ ticket: Ticket }>(basePath, input);
    return result.ticket;
  };

  const updateTicket = async (id: string, input: UpdateTicketInput): Promise<Ticket> => {
    const result = await api.patch<{ ticket: Ticket }>(`${basePath}/${id}`, input);
    return result.ticket;
  };

  const addComment = async (id: string, message: string): Promise<TicketComment> => {
    const result = await api.post<{ comment: TicketComment }>(`${basePath}/${id}/comments`, { message });
    return result.comment;
  };

  const getStats = async (): Promise<TicketStats> => {
    const result = await api.get<{ stats: TicketStats }>(`${basePath}/stats`);
    return result.stats;
  };

  const listAssignees = async (): Promise<Assignee[]> => {
    const result = await api.get<{ assignees: Assignee[] }>(`${basePath}/assignees`);
    return result.assignees;
  };

  return {
    listCategories,
    listAllCategories,
    createCategory,
    updateCategory,
    listTickets,
    getTicket,
    createTicket,
    updateTicket,
    addComment,
    getStats,
    listAssignees,
  };
}
