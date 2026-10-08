import type { ApiResponse } from "../types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let inMemoryAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (!options.skipAuth && inMemoryAccessToken) {
    headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include", // Pass HTTP-only refresh cookies
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error. Is the backend server running?",
      errorCode: "NETWORK_ERROR",
    };
  }

  // Handle 401 Unauthorized with token refresh (if not an auth endpoint already)
  const isAuthRoute =
    endpoint.includes("/auth/login") ||
    endpoint.includes("/auth/register") ||
    endpoint.includes("/auth/refresh");

  if (response.status === 401 && !isAuthRoute) {
    const newToken = await attemptSilentRefresh();

    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      try {
        response = await fetch(url, { ...config, headers });
      } catch (retryErr) {
        return {
          success: false,
          message:
            retryErr instanceof Error ? retryErr.message : "Retry failed after token refresh",
          errorCode: "NETWORK_ERROR",
        };
      }
    }
  }

  try {
    const data = (await response.json()) as ApiResponse<T>;
    return data;
  } catch {
    return {
      success: response.ok,
      message: `HTTP ${response.status}: ${response.statusText}`,
      errorCode: `HTTP_${response.status}`,
    };
  }
}

async function attemptSilentRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        setAccessToken(null);
        return null;
      }

      const json = (await res.json()) as ApiResponse<{ accessToken: string }>;
      if (json.success && json.data?.accessToken) {
        setAccessToken(json.data.accessToken);
        return json.data.accessToken;
      }

      setAccessToken(null);
      return null;
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const api = {
  get<T>(endpoint: string, options?: RequestOptions) {
    return request<T>(endpoint, { ...options, method: "GET" });
  },
  post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  delete<T>(endpoint: string, options?: RequestOptions) {
    return request<T>(endpoint, { ...options, method: "DELETE" });
  },
  attemptSilentRefresh,
};
