import { api, PaginationMeta } from "@/lib/api";

export type NotificationType =
  | "BLOOD_REQUEST"
  | "DONOR_RESPONSE"
  | "APPOINTMENT"
  | "REQUEST_UPDATE"
  | "VERIFICATION"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationsMeta extends PaginationMeta {
  unread: number;
}

export const notificationsApi = {
  listMine: (params: { unreadOnly?: boolean; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.unreadOnly) qs.set("unreadOnly", "true");
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<AppNotification[], NotificationsMeta>(
      `/api/v1/notifications${query ? `?${query}` : ""}`
    );
  },

  unreadCount: () =>
    api.get<{ count: number }>("/api/v1/notifications/unread-count"),

  markRead: (id: string) =>
    api.patch<{ notification: AppNotification }>(
      `/api/v1/notifications/${id}/read`
    ),

  markAllRead: () =>
    api.patch<{ updated: number }>("/api/v1/notifications/read-all"),
};

export const NOTIFICATIONS_KEY = ["notifications"] as const;
export const NOTIFICATIONS_UNREAD_KEY = [
  "notifications",
  "unread-count",
] as const;
