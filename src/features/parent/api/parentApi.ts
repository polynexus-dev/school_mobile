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
    const rawStudents = res.data?.results ?? res.data ?? [];
    return rawStudents.map((s: any) => ({
      id: s.id,
      admission_no: s.admission_no,
      first_name: s.user_detail?.first_name ?? s.first_name ?? "",
      last_name: s.user_detail?.last_name ?? s.last_name ?? "",
      class_section: s.class_section_name ?? s.class_section ?? "",
      roll_no: s.roll_number ?? s.roll_no ?? "",
    }));
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
