export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface TicketCategory {
  id: string;
  name: string;
  module: string;
  icon: string | null;
  active: boolean;
}

export interface TicketComment {
  id: string;
  message: string;
  createdAt: string;
  userId: string;
  userName: string | null;
  userEmail: string;
}

export interface Ticket {
  id: string;
  module: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  createdById: string;
  createdByName: string | null;
  createdByEmail: string;
  assignedToId: string | null;
  assignedToName: string | null;
  assignedToEmail: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  comments?: TicketComment[];
}

export interface TicketStats {
  total: number;
  byStatus: Record<TicketStatus, number>;
  byPriority: Record<TicketPriority, number>;
}

export interface TicketListResult {
  tickets: Ticket[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Assignee {
  id: string;
  name: string | null;
  email: string;
  designation: string | null;
}

export interface CreateTicketInput {
  title: string;
  description: string;
  categoryId: string;
  priority?: TicketPriority;
  assignedToId?: string;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  categoryId?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedToId?: string | null;
}
