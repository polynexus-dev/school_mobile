import httpClient from "@services/api/httpClient";

export interface AppNotification {
  id: number;
  notification_type: string;
  title: string;
  message: string | null;
  related_object: Record<string, any>;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const notificationApi = {
  // GET /api/notifications/?is_read=true|false&page=N -> paginated
  getNotifications: async (page = 1, isRead?: boolean): Promise<Page<AppNotification>> => {
    const res = await httpClient.get("/api/notifications/", {
      params: { page, ...(isRead != null ? { is_read: isRead } : {}) },
    });
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await httpClient.get("/api/notifications/unread_count/");
    return res.data?.unread_count ?? 0;
  },

  markRead: async (id: number): Promise<AppNotification> => {
    const res = await httpClient.post(`/api/notifications/${id}/mark_read/`);
    return res.data;
  },

  markAllRead: async (): Promise<number> => {
    const res = await httpClient.post("/api/notifications/mark_all_read/");
    return res.data?.marked_read ?? 0;
  },
};
