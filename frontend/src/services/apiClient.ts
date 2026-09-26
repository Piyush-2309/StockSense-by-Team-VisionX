/**
 * StockSense Centralized API Client
 *
 * Single HTTP client used by ALL service modules.
 * Handles: base URL, auth headers, token refresh, error normalization.
 *
 * Token storage tradeoff: access token held in memory, refresh token in
 * localStorage because the Vite SPA cannot set HttpOnly cookies itself.
 * The refresh token is only ever sent to /api/v1/auth/refresh.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

// ---- Token storage (module-scoped, NOT exported) ----
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken(): string | null {
  return accessToken;
}

const REFRESH_KEY = 'stocksense_refresh_token';
export function setRefreshToken(token: string | null) {
  if (token) localStorage.setItem(REFRESH_KEY, token);
  else localStorage.removeItem(REFRESH_KEY);
}
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  accessToken = null;
  localStorage.removeItem(REFRESH_KEY);
}

// ---- Standardised API error ----
export interface ApiError {
  success: false;
  code: string;
  message: string;
  errors?: Record<string, string>;
  path?: string;
  status: number;
}

export class ApiRequestError extends Error {
  code: string;
  status: number;
  errors?: Record<string, string>;
  path?: string;

  constructor(err: ApiError) {
    super(err.message);
    this.name = 'ApiRequestError';
    this.code = err.code;
    this.status = err.status;
    this.errors = err.errors;
    this.path = err.path;
  }
}

// ---- Listeners for auth state changes (logout events) ----
type AuthListener = () => void;
const authListeners = new Set<AuthListener>();
export function onForceLogout(fn: AuthListener) {
  authListeners.add(fn);
  return () => authListeners.delete(fn);
}
function fireForceLogout() {
  authListeners.forEach((fn) => fn());
}

// ---- Token refresh logic ----
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const body = await res.json();
    if (body.success && body.data) {
      setAccessToken(body.data.accessToken);
      setRefreshToken(body.data.refreshToken);
      return true;
    }
    clearTokens();
    return false;
  } catch {
    clearTokens();
    return false;
  }
}

// De-duplicate concurrent refresh attempts
function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = attemptRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ---- Core request function ----
interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, skipAuth, ...init } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const url = `${API_BASE}${path}`;

  let res = await fetch(url, {
    ...init,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  // Auto-refresh on 401
  if (res.status === 401 && !skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(url, {
        ...init,
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
      });
    } else {
      fireForceLogout();
      throw new ApiRequestError({
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'Session expired. Please log in again.',
        status: 401,
      });
    }
  }

  // Handle non-JSON responses (e.g. 204)
  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    if (res.ok) return undefined as T;
    throw new ApiRequestError({
      success: false,
      code: 'NETWORK_ERROR',
      message: `Unexpected response (${res.status})`,
      status: res.status,
    });
  }

  const json = await res.json();

  if (!res.ok || json.success === false) {
    throw new ApiRequestError({
      success: false,
      code: json.code ?? 'UNKNOWN_ERROR',
      message: json.message ?? 'An unexpected error occurred.',
      errors: json.errors,
      path: json.path,
      status: res.status,
    });
  }

  // Unwrap { success: true, data: T } envelope
  return json.data as T;
}

// ---- Public convenience methods ----
export const apiClient = {
  get<T>(path: string, opts?: RequestOptions) {
    return request<T>(path, { ...opts, method: 'GET' });
  },
  post<T>(path: string, body?: unknown, opts?: RequestOptions) {
    return request<T>(path, { ...opts, method: 'POST', body });
  },
  put<T>(path: string, body?: unknown, opts?: RequestOptions) {
    return request<T>(path, { ...opts, method: 'PUT', body });
  },
  patch<T>(path: string, body?: unknown, opts?: RequestOptions) {
    return request<T>(path, { ...opts, method: 'PATCH', body });
  },
  delete<T>(path: string, opts?: RequestOptions) {
    return request<T>(path, { ...opts, method: 'DELETE' });
  },
};
