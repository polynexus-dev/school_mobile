import { create } from "zustand";
import { storage } from "@services/storage/secureStore";

export type UserRole = "teacher" | "parent" | "conductor";

export interface LinkedStudent {
  id: number;
  admission_no: string;
  first_name: string;
  last_name?: string;
  class_section: string; // e.g. "7-A"
  roll_no?: string | number;
  bus_route?: number | null; // FK id on StudentProfile — used to subscribe to live bus tracking
}

export interface UserProfile {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  consent_given?: boolean;
  tenant_name?: string; // school name
  tenant_logo?: string | null;

  // Teacher-specific
  teacher_profile?: {
    is_class_teacher: boolean;
    class_section?: string | null;
    is_hm?: boolean;
    designation?: string | null;
  };

  // Conductor-specific
  conductor_profile?: {
    bus_route_id: number | null;
    bus_route_name?: string | null;
  };

  // Parent/guardian-specific
  guardian_profile?: {
    guardian_id: number;
  };
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  role: UserRole | null;
  schoolDomain: string | null;
  schoolSchema: string | null;
  deviceId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Parent-only: the linked children roster + which child is active in the
  // header switcher. Populated after login / the link-children onboarding step.
  students: LinkedStudent[];
  activeStudentId: number | null;

  initializeAuth: () => Promise<void>;
  setAuth: (user: UserProfile, token: string) => Promise<void>;
  setSchoolDomain: (domain: string | null) => Promise<void>;
  setSchoolSchema: (schema: string | null) => Promise<void>;
  setDeviceId: (deviceId: string) => Promise<void>;
  updateConsentStatus: (status: boolean) => void;
  setStudents: (students: LinkedStudent[]) => Promise<void>;
  setActiveStudentId: (id: number | null) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  role: null,
  schoolDomain: null,
  schoolSchema: null,
  deviceId: null,
  isAuthenticated: false,
  isLoading: true,
  students: [],
  activeStudentId: null,

  initializeAuth: async () => {
    try {
      const storedToken = await storage.getItem("cns_token");
      const storedUser = await storage.getItem("cns_user");
      const storedDomain = await storage.getItem("cns_domain");
      const storedSchema = await storage.getItem("cns_schema");
      const storedDeviceId = await storage.getItem("cns_device_id");
      const storedStudents = await storage.getItem("cns_students");
      const storedActiveStudent = await storage.getItem("cns_active_student");

      const parsedUser: UserProfile | null = storedUser ? JSON.parse(storedUser) : null;
      if (parsedUser && parsedUser.role) {
        parsedUser.role = parsedUser.role.toLowerCase() as UserRole;
      }

      set({
        token: storedToken,
        user: parsedUser,
        role: parsedUser?.role ?? null,
        schoolDomain: storedDomain,
        schoolSchema: storedSchema,
        deviceId: storedDeviceId,
        isAuthenticated: !!storedToken,
        isLoading: false,
        students: storedStudents ? JSON.parse(storedStudents) : [],
        activeStudentId: storedActiveStudent ? Number(storedActiveStudent) : null,
      });
    } catch (error) {
      console.error("Auth initialization failed", error);
      set({ isLoading: false });
    }
  },

  setAuth: async (user, token) => {
    if (user && user.role) {
      user.role = user.role.toLowerCase() as UserRole;
    }
    await storage.setItem("cns_token", token);
    await storage.setItem("cns_user", JSON.stringify(user));
    set({ user, token, role: user.role, isAuthenticated: true });
  },

  setSchoolDomain: async (domain) => {
    if (domain) {
      await storage.setItem("cns_domain", domain);
    } else {
      await storage.removeItem("cns_domain");
    }
    set({ schoolDomain: domain });
  },

  setSchoolSchema: async (schema) => {
    if (schema) {
      await storage.setItem("cns_schema", schema);
    } else {
      await storage.removeItem("cns_schema");
    }
    set({ schoolSchema: schema });
  },

  setDeviceId: async (deviceId) => {
    await storage.setItem("cns_device_id", deviceId);
    set({ deviceId });
  },

  updateConsentStatus: (status) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, consent_given: status };
      storage.setItem("cns_user", JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },

  setStudents: async (students) => {
    await storage.setItem("cns_students", JSON.stringify(students));
    set({ students });
    // Default the switcher to the first child if nothing is selected yet.
    if (!get().activeStudentId && students.length > 0) {
      await get().setActiveStudentId(students[0].id);
    }
  },

  setActiveStudentId: async (id) => {
    if (id !== null) {
      await storage.setItem("cns_active_student", String(id));
    } else {
      await storage.removeItem("cns_active_student");
    }
    set({ activeStudentId: id });
  },

  logout: async () => {
    await storage.removeItem("cns_token");
    await storage.removeItem("cns_user");
    // schoolSchema must not survive logout: httpClient attaches it as the
    // X-Tenant header on every request including the next login attempt,
    // and the backend's login endpoint rejects any request that isn't on
    // the public schema — so a stale schema here permanently locks the
    // device out of logging back in as anyone, on any school.
    await storage.removeItem("cns_domain");
    await storage.removeItem("cns_schema");
    await storage.removeItem("cns_students");
    await storage.removeItem("cns_active_student");
    // deviceId is kept — it's the biometric device-lock fingerprint and must
    // stay stable across logins on the same physical device.
    set({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      schoolDomain: null,
      schoolSchema: null,
      students: [],
      activeStudentId: null,
    });
  },
}));
