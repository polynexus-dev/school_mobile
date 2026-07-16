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

async function fetchProfileWithToken(access: string, tenantSchema?: string | null): Promise<UserProfile> {
  const res = await httpClient.get("/api/profile/", {
    headers: {
      Authorization: `Bearer ${access}`,
      ...(tenantSchema ? { "X-Tenant": tenantSchema } : {}),
    },
  });
  return res.data;
}

export const authApi = {
  /** Teacher / Conductor plain username+password login. */
  login: async (username: string, password: string): Promise<LoginResult> => {
    const tokenRes = await httpClient.post<TokenResponse>("/api/token/", { username, password });
    const { access, refresh, tenant_domain, tenant_schema } = tokenRes.data;
    const profile = await fetchProfileWithToken(access, tenant_schema);
    return { access, refresh, tenant_domain, tenant_schema, profile };
  },

  /** Parent onboarding step 1: request a 6-digit OTP against the invited phone number. */
  requestParentOtp: async (phone: string): Promise<{ message: string }> => {
    const res = await httpClient.post("/api/parent/otp/request/", { phone });
    return res.data;
  },

  /** Parent onboarding step 2: verify the OTP, receive JWT + resolved tenant. */
  verifyParentOtp: async (phone: string, otp: string): Promise<LoginResult> => {
    const tokenRes = await httpClient.post<TokenResponse>("/api/parent/otp/verify/", { phone, otp });
    const { access, refresh, tenant_domain, tenant_schema } = tokenRes.data;
    const profile = await fetchProfileWithToken(access, tenant_schema);
    return { access, refresh, tenant_domain, tenant_schema, profile };
  },

  /** Candidate + confirmed guardian-student links for the signed-in parent. */
  getGuardianLinks: async (): Promise<{ id: number; status: "pending" | "verified" | "rejected"; student: LinkedStudent }[]> => {
    const res = await httpClient.get("/api/guardian-links/");
    return res.data?.results ?? res.data ?? [];
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
};
