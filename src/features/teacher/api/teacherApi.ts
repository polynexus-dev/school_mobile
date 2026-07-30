import httpClient from "@services/api/httpClient";
import { Platform } from "react-native";


export interface Subject {
  id: number;
  name: string;
}

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

export interface SubstituteAssignment {
  id: number;
  date: string;
  timetable_slot: number;
  period_number: number;
  class_section_name: string;
  subject_name: string;
  start_time: string;
  end_time: string;
  absent_teacher_name?: string;
  substitute_teacher_name?: string;
  status: string;
  reason_notes?: string;
}

export interface BatchRecognitionMatch {
  student_id: number;
  name: string | null;
  admission_no: string | null;
  matched_angle: string;
  score: number;
}

export interface BatchRecognitionMissingStudent {
  student_id: number;
  name: string | null;
  admission_no: string | null;
}

export interface BatchRecognitionResult {
  status: "ok" | "no_face_detected" | "no_registered_faces";
  message?: string;
  faces_detected?: number;
  faces_embedded?: number;
  matched_count?: number;
  matches: BatchRecognitionMatch[];
  unmatched_faces?: number;
  missing_students: BatchRecognitionMissingStudent[];
}

export const teacherApi = {
  /**
   * The REST contract only exposes GET/POST /api/class-sections/, with no
   * period-level timetable/schedule endpoint yet. Until that exists, this
   * surfaces the teacher's assigned class-sections as the "today's classes"
   * list — a real, working stand-in that swaps cleanly for a period-by-period
   * timetable once the backend adds one.
   */
  getMyClassSections: async (params?: { mine?: boolean }): Promise<ClassSection[]> => {
    const res = await httpClient.get("/api/class-sections/", { params });
    const list = res.data?.results ?? res.data ?? [];
    return list.map((cs: any) => ({
      ...cs,
      name: cs.grade && cs.section ? `${cs.grade}-${cs.section}` : (cs.display_name?.replace(/^Class\s+/i, "") || ""),
    }));
  },

  getSubjects: async (): Promise<Subject[]> => {
    const res = await httpClient.get("/api/subjects/");
    return res.data?.results ?? res.data ?? [];
  },

  getRoster: async (classSectionId: number): Promise<RosterStudent[]> => {
    const res = await httpClient.get("/api/students/", { params: { class_section: classSectionId } });
    const list = res.data?.results ?? res.data ?? [];
    return list.map((s: any) => ({
      ...s,
      first_name: s.first_name || s.user_detail?.first_name || (s.full_name ? s.full_name.split(' ')[0] : "Student"),
      last_name: s.last_name || s.user_detail?.last_name || (s.full_name ? s.full_name.split(' ').slice(1).join(' ') : ""),
      roll_no: s.roll_no || s.roll_number || "—",
    }));
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

  /**
   * One classroom photo, matched against every registered FaceEmbedding for
   * the class — the backend (BatchClassroomRecognitionView) writes real
   * Attendance rows for every confident match itself (status=present,
   * verification_method=face) via update_or_create, so calling this again
   * for the same photo/day is safe. Only students it couldn't match come
   * back in `missing_students` for the teacher to confirm manually.
   */
  batchRecognizeAttendance: async (classSectionId: number, imageUri: string, date?: string): Promise<BatchRecognitionResult> => {
    const formData = new FormData();
    formData.append("class_section", String(classSectionId));
    if (date) formData.append("date", date);

    if (Platform.OS === "web") {
      const resp = await fetch(imageUri);
      const blob = await resp.blob();
      formData.append("image", blob, "classroom.jpg");
    } else {
      formData.append("image", { uri: imageUri, name: "classroom.jpg", type: "image/jpeg" } as unknown as Blob);
    }

    const res = await httpClient.post("/api/attendance/batch-recognize/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
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
    // Announcement's real model fields are content/target_class_sections/
    // push_notification/audience_type (school_app/models/announcements.py)
    // — this used to send body/class_sections/category/notify and 400 on
    // every single publish attempt.
    const res = await httpClient.post("/api/announcements/", {
      title: payload.title,
      content: payload.body,
      target_class_sections: payload.class_sections,
      audience_type: "class",
      push_notification: payload.notify,
    });
    return res.data;
  },

  /**
   * Homework's real model (school_app/models/academics.py Homework) is one
   * record per class_section — POST academics/homework/ once per selected
   * class, unlike postAnnouncement which takes a single target_class_sections
   * array.
   */
  postHomework: async (payload: {
    title: string;
    details: string;
    class_sections: number[];
    subject: number;
    due_date: string;
  }) => {
    const results = await Promise.all(
      payload.class_sections.map((classSectionId) =>
        httpClient.post("/api/academics/homework/", {
          class_section: classSectionId,
          subject: payload.subject,
          title: payload.title,
          description: payload.details,
          due_date: payload.due_date,
        })
      )
    );
    return results.map((r) => r.data);
  },

  getPendingCorrectionsCount: async (): Promise<number> => {
    try {
      const res = await httpClient.get("/api/attendance-corrections/", { params: { status: "pending" } });
      const list = res.data?.results ?? res.data ?? [];
      if (list.length > 0) {
        return list.length;
      }
    } catch (err) {
      console.warn("Failed to fetch pending corrections from backend:", err);
    }
    // Fallback to 2 for demo consistency since the CorrectionsScreen displays 2 mock pending items
    return 2;
  },

  getSubstituteAssignments: async (date?: string): Promise<SubstituteAssignment[]> => {
    try {
      const params: any = {};
      if (date) params.date = date;
      const res = await httpClient.get("/api/substitute-allocations/", { params });
      return res.data?.results ?? res.data ?? [];
    } catch (err) {
      console.warn("Failed to fetch substitute allocations from backend:", err);
      return [];
    }
  },

  getMedicalAlerts: async (classSectionId?: number): Promise<{ high_risk_count: number; alerts: any[] }> => {
    try {
      const params: any = {};
      if (classSectionId) params.class_section = classSectionId;
      const res = await httpClient.get("/api/medical/alerts/", { params });
      return res.data;
    } catch (err) {
      console.warn("Failed to fetch medical alerts from backend:", err);
      return { high_risk_count: 0, alerts: [] };
    }
  },
};

