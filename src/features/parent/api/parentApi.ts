import httpClient from "@services/api/httpClient";
import { LinkedStudent } from "@store/authStore";

export type AttendanceStatus = "present" | "absent" | "leave";

export interface AttendanceEntry {
  id: number;
  student: number;
  class_section?: number;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
}

export interface AnnouncementItem {
  id: number;
  title: string;
  body: string;
  category?: string; // e.g. "class" | "transport" | "school" | "fees"
  class_section_name?: string;
  created_at: string;
}

export const parentApi = {
  /** Linked children for the signed-in guardian (backend scopes this by the requesting user). */
  getMyChildren: async (): Promise<LinkedStudent[]> => {
    const res = await httpClient.get("/api/students/");
    return res.data?.results ?? res.data ?? [];
  },

  getAttendance: async (studentId: number, month?: string): Promise<AttendanceEntry[]> => {
    const res = await httpClient.get("/api/attendance/", {
      params: { student: studentId, ...(month ? { month } : {}) },
    });
    return res.data?.results ?? res.data ?? [];
  },

  getAnnouncements: async (): Promise<AnnouncementItem[]> => {
    const res = await httpClient.get("/api/announcements/");
    return res.data?.results ?? res.data ?? [];
  },
};
