import httpClient from "@services/api/httpClient";
import { UserProfile, LinkedStudent } from "@store/authStore";

interface TokenResponse {
  access: string;
  refresh: string;
  // The backend resolves the tenant during login (same rationale as the
  // college app: login always hits the public schema, backend figures out
  // which school this user belongs to and hands back its domain/schema).
  tenant_domain?: string | null;
  tenant_schema?: string | null;
}

interface LoginResult extends TokenResponse {
  profile: UserProfile;
}

export interface GuardianOtpRequestResponse {
  message: string;
  tenant_schema?: string | null;
  tenant_code?: string | null;
}

async function fetchProfileWithToken(access: string, tenantSchema?: string | null): Promise<UserProfile> {
  const res = await httpClient.get("/api/profile/", {
    headers: {
      Authorization: `Bearer ${access}`,
      ...(tenantSchema ? { "X-Tenant": tenantSchema } : {}),
    },
  });
  const data = res.data;
  
  // Normalize fields so the frontend gets a consistent UserProfile structure
  const normalized: any = {
    ...data,
    tenant_name: data.tenant,
  };

  if (data.user) {
    normalized.username = data.user.username;
    normalized.email = data.user.email;
    normalized.first_name = data.user.first_name;
    normalized.last_name = data.user.last_name;
  } else {
    // For Parent profile, split full_name into first_name and last_name
    const fullName = data.full_name || "";
    const parts = fullName.trim().split(/\s+/);
    normalized.first_name = parts[0] || "";
    normalized.last_name = parts.slice(1).join(" ") || "";
    normalized.username = data.phone_number || "";
    normalized.email = data.email || "";
  }
  
  return normalized;
}

export const authApi = {
  /** Teacher / Conductor plain username+password login. */
  login: async (username: string, password: string): Promise<LoginResult> => {
    const tokenRes = await httpClient.post<TokenResponse>("/api/token/", { username, password });
    const { access, refresh, tenant_domain, tenant_schema } = tokenRes.data;
    const profile = await fetchProfileWithToken(access, tenant_schema);
    return { access, refresh, tenant_domain, tenant_schema, profile };
  },

  /**
   * Parent onboarding step 1: request a 6-digit email OTP for the guardian
   * matched by phone number or email. The response carries the resolved
   * `tenant_schema` (the backend searches every tenant to find the guardian,
   * since the client doesn't know which school it is yet) — that value must
   * be threaded through to `verifyParentOtp`, which requires it.
   */
  requestParentOtp: async (identifier: string, tenantSchema?: string): Promise<GuardianOtpRequestResponse> => {
    const res = await httpClient.post<GuardianOtpRequestResponse>("/api/guardian/otp/request/", {
      identifier,
      ...(tenantSchema ? { tenant_schema: tenantSchema } : {}),
    });
    return res.data;
  },

  /** Parent onboarding step 2: verify the OTP, receive JWT + resolved tenant. */
  verifyParentOtp: async (identifier: string, code: string, tenantSchema: string): Promise<LoginResult> => {
    const tokenRes = await httpClient.post<TokenResponse>("/api/guardian/otp/verify/", {
      identifier,
      code,
      tenant_schema: tenantSchema,
    });
    const { access, refresh, tenant_schema } = tokenRes.data;
    const resolvedSchema = tenant_schema ?? tenantSchema;
    const profile = await fetchProfileWithToken(access, resolvedSchema);
    return { access, refresh, tenant_domain: null, tenant_schema: resolvedSchema, profile };
  },

  /** Candidate + confirmed guardian-student links for the signed-in parent. */
  getGuardianLinks: async (): Promise<{ id: number; status: "pending" | "verified" | "rejected"; student: LinkedStudent }[]> => {
    const res = await httpClient.get("/api/guardian-links/");
    const rawLinks = res.data?.results ?? res.data ?? [];
    return rawLinks.map((l: any) => ({
      id: l.id,
      status: l.status,
      student: l.student ? {
        id: l.student.id,
        admission_no: l.student.admission_no,
        first_name: l.student.user_detail?.first_name ?? l.student.first_name ?? "",
        last_name: l.student.user_detail?.last_name ?? l.student.last_name ?? "",
        class_section: l.student.class_section_name ?? l.student.class_section ?? "",
        roll_no: l.student.roll_number ?? l.student.roll_no ?? "",
      } : null
    })).filter((l: any) => l.student !== null);
  },

  /** Confirm one or more phone-matched candidate students found during onboarding. */
  confirmGuardianLinks: async (studentIds: number[]) => {
    const res = await httpClient.post("/api/guardian-links/", { confirm_student_ids: studentIds });
    return res.data;
  },

  /** Request a link to a child not auto-matched by phone (manual admission-no entry). */
  requestGuardianLink: async (admissionNo: string) => {
    const res = await httpClient.post("/api/guardian-links/", { admission_no: admissionNo });
    return res.data;
  },

  grantConsent: async () => {
    const res = await httpClient.post("/api/consent/grant/");
    return res.data;
  },

  withdrawConsent: async (consentType?: string) => {
    const res = await httpClient.post("/api/consent/withdraw/", consentType ? { consent_type: consentType } : {});
    return res.data;
  },

  getConsentRecords: async () => {
    const res = await httpClient.get("/api/consent-records/");
    return res.data;
  },

  toggleConsentRecord: async (consentType: string, isGranted: boolean) => {
    const res = await httpClient.post("/api/consent-records/toggle/", {
      consent_type: consentType,
      is_granted: isGranted,
    });
    return res.data;
  },

  registerFaceEmbedding: async (studentId: number, angle: string, imageUri: string) => {
    const formData = new FormData();
    formData.append("student", String(studentId));
    formData.append("angle", angle);
    formData.append("image", {
      uri: imageUri,
      name: `face_${angle}.jpg`,
      type: "image/jpeg",
    } as any);

    const res = await httpClient.post("/api/face-embeddings/register/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  registerStaffFaceEmbedding: async (angle: string, imageUri: string) => {
    const formData = new FormData();
    formData.append("angle", angle);
    formData.append("image", {
      uri: imageUri,
      name: `staff_face_${angle}.jpg`,
      type: "image/jpeg",
    } as any);

    const res = await httpClient.post("/api/face-embeddings/register_staff/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  staffFaceCheckin: async (actionType: 'check_in' | 'check_out', confidence: number = 0.96) => {
    const res = await httpClient.post("/api/staff-attendance/face-checkin/", {
      action_type: actionType,
      confidence,
      device_id: "MOBILE_APP",
    });
    return res.data;
  },

  checkStaffFaceStatus: async (): Promise<{ is_registered: boolean; registered_count: number; angles: string[] }> => {
    const res = await httpClient.get("/api/face-embeddings/staff_status/");
    return res.data;
  },
};


