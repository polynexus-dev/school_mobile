import axios from "axios";
import { buildUrl } from "./buildUrl";
import { useAuthStore } from "@store/authStore";
import { ApiError } from "@/errors/ApiError";
import { logError } from "@/errors/errorHandler";

export const httpClient = axios.create({
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Interceptor for resolving URLs dynamically and attaching authorization tokens
httpClient.interceptors.request.use(
  (config) => {
    if (config.url && !config.url.startsWith("http")) {
      config.url = buildUrl(config.url);
    }

    const url = config.url || "";
    const isLoginRequest = url.includes("/api/token/") || url.includes("/api/parent/otp/");
    console.log(`[HTTP Interceptor] Request to: ${url} (isLoginRequest=${isLoginRequest})`);

    const token = useAuthStore.getState().token;
    if (token && !isLoginRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (isLoginRequest) {
      delete config.headers.Authorization;
      if (config.headers.delete) {
        config.headers.delete("Authorization");
        config.headers.delete("authorization");
      }
    }

    const schoolSchema = useAuthStore.getState().schoolSchema;
    if (schoolSchema && !isLoginRequest) {
      config.headers["X-Tenant"] = schoolSchema;
    } else if (isLoginRequest) {
      delete config.headers["X-Tenant"];
      if (config.headers.delete) {
        config.headers.delete("X-Tenant");
        config.headers.delete("x-tenant");
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor for normalizing errors
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const statusCode: number = error?.response?.status ?? 500;
    const endpoint: string = error?.config?.url ?? "unknown";
    let message = "An unexpected error occurred.";

    if (error.response) {
      const data = error.response.data;
      if (data && typeof data === "object") {
        if (data.error) message = data.error;
        else if (data.detail) message = data.detail;
        else if (data.message) message = data.message;
        else {
          // Flatten standard DRF serializer errors
          const firstVal = Object.values(data)[0];
          if (Array.isArray(firstVal)) {
            message = String(firstVal[0]);
          } else if (typeof firstVal === "string") {
            message = firstVal;
          } else if (firstVal) {
            message = JSON.stringify(firstVal);
          } else {
            message = JSON.stringify(data);
          }
        }
      }
    } else if (error.request) {
      message = "No response received from the server. Check your network connection.";
    } else if (error.message) {
      message = error.message;
    }

    const responseData = error?.response?.data;
    const apiError = ApiError.fromResponse(statusCode, message, endpoint, responseData);
    logError(apiError, `httpClient:response [${endpoint}]`);

    // Handle session expiry / token invalidation
    if (statusCode === 401) {
      const isLoginRequest =
        endpoint.includes("/api/token/") || endpoint.includes("/api/guardian/otp/");
      if (!isLoginRequest) {
        try {
          await useAuthStore.getState().logout();
        } catch (logoutError) {
          console.error("Failed to automatically logout after 401 error", logoutError);
        }
      }
    }

    return Promise.reject(apiError);
  }
);
export default httpClient;
