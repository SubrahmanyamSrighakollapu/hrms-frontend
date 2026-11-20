import { api } from "@/lib/api";

export interface AppNotification {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationList {
  notifications: AppNotification[];
  unreadCount: number;
}

export function listNotifications(): Promise<NotificationList> {
  return api.get<NotificationList>("/notifications?limit=30");
}

export function markNotificationRead(id: string): Promise<AppNotification> {
  return api.patch<{ notification: AppNotification }>(`/notifications/${id}/read`).then((r) => r.notification);
}

export function markAllNotificationsRead(): Promise<{ updated: number }> {
  return api.patch<{ updated: number }>("/notifications/read-all");
}
