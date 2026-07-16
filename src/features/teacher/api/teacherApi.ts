import httpClient from "@services/api/httpClient";

export interface ClassSection {
  id: number;
  name: string; // e.g. "7-A"
  grade?: string;
  section?: string;
  subject_name?: string;
  room?: string;
  student_count?: number;
  is_class_teacher_for?: boolean;
}

export interface RosterStudent {
  id: number;
  admission_no: string;
  first_name: string;
  last_name?: string;
  roll_no?: string | number;
  class_section: number;
}

export type AttendanceStatus = "present" | "absent" | "leave";

export interface AttendanceRecord {
  id?: number;
  student: number;
  class_section: number;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

export const teacherApi = {
  /**
   * The REST contract only exposes GET/POST /api/class-sections/, with no
   * period-level timetable/schedule endpoint yet. Until that exists, this
   * surfaces the teacher's assigned class-sections as the "today's classes"
   * list — a real, working stand-in that swaps cleanly for a period-by-period
   * timetable once the backend adds one.
   */
  getMyClassSections: async (): Promise<ClassSection[]> => {
    const res = await httpClient.get("/api/class-sections/");
    return res.data?.results ?? res.data ?? [];
  },

  getRoster: async (classSectionId: number): Promise<RosterStudent[]> => {
    const res = await httpClient.get("/api/students/", { params: { class_section: classSectionId } });
    return res.data?.results ?? res.data ?? [];
  },

  getAttendanceForDate: async (classSectionId: number, date: string): Promise<AttendanceRecord[]> => {
    const res = await httpClient.get("/api/attendance/", { params: { class_section: classSectionId, date } });
    return res.data?.results ?? res.data ?? [];
  },

  /** Bulk-submits one status entry per roster student for the given day. */
  submitAttendance: async (records: AttendanceRecord[]): Promise<AttendanceRecord[]> => {
    const res = await httpClient.post("/api/attendance/", records);
    return res.data;
  },

  /** Publishes a homework/announcement post to a set of class-sections. */
  postAnnouncement: async (payload: {
    title: string;
    body: string;
    class_sections: number[];
    category: "homework" | "announcement";
    due_date?: string | null;
    notify: boolean;
  }) => {
    const res = await httpClient.post("/api/announcements/", payload);
    return res.data;
  },
};
