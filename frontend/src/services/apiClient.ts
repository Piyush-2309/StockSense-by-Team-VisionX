/**
<<<<<<< HEAD
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
=======
 * StockSense Centralized Production API Client
 *
 * Responsibilities:
 * - Base URL resolution & request timeout management
 * - Automatic Authorization header injection
 * - Proactive and reactive token refresh on 401
 * - Strict error normalization (API codes, validations, network dropouts)
 * - Safe session recovery and logout redirection
 */

export interface ApiErrorPayload {
>>>>>>> e5898a935da6d61920e1ab01dc90bd3dfb05bc54
  code: string;
  message: string;
  errors?: Record<string, string>;
  path?: string;
<<<<<<< HEAD
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
=======
}

export class ApiError extends Error {
  public code: string;
  public errors?: Record<string, string>;
  public status: number;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message || 'An unexpected API error occurred.');
    this.name = 'ApiError';
    this.status = status;
    this.code = payload.code || 'UNKNOWN_ERROR';
    this.errors = payload.errors;
  }
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: number | string;
    name: string;
    email: string;
    role: string;
  };
}

const STORAGE_KEY_AUTH = 'stocksense_auth_session';

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];
  private serverOnline = true;
  private onConnectionChangeListeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    // Remove trailing slash if present
    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
  }

  // --- Auth Session Management ---

  public getSession(): AuthSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AUTH);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public setSession(session: AuthSession) {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
  }

  public clearSession() {
    localStorage.removeItem(STORAGE_KEY_AUTH);
  }

  public getAccessToken(): string | null {
    const session = this.getSession();
    return session ? session.accessToken : null;
  }

  public getRefreshToken(): string | null {
    const session = this.getSession();
    return session ? session.refreshToken : null;
  }

  public isServerOnline(): boolean {
    return this.serverOnline;
  }

  public subscribeConnectionChange(listener: (online: boolean) => void): () => void {
    this.onConnectionChangeListeners.add(listener);
    return () => {
      this.onConnectionChangeListeners.delete(listener);
    };
  }

  private setServerStatus(online: boolean) {
    if (this.serverOnline !== online) {
      this.serverOnline = online;
      this.onConnectionChangeListeners.forEach((l) => l(online));
    }
  }

  // --- Request Core ---

  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    headers.set('Accept', 'application/json');

    const token = this.getAccessToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.setServerStatus(true);

      // Handle 401 Unauthorized with Token Refresh
      if (response.status === 401 && !isRetry && !endpoint.includes('/auth/')) {
        const refreshedToken = await this.handleTokenRefresh();
        if (refreshedToken) {
          headers.set('Authorization', `Bearer ${refreshedToken}`);
          return this.request<T>(endpoint, { ...options, headers }, true);
        } else {
          this.clearSession();
          throw new ApiError(401, {
            code: 'SESSION_EXPIRED',
            message: 'Your session has expired. Please sign in again.',
          });
        }
      }

      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : null;

      if (!response.ok) {
        const errorPayload: ApiErrorPayload = {
          code: data?.code || `HTTP_${response.status}`,
          message: data?.message || response.statusText || 'Request failed',
          errors: data?.errors,
          path: data?.path || endpoint,
        };
        throw new ApiError(response.status, errorPayload);
      }

      // Check standard ApiResponse wrapper: { success: true, data: ... }
      if (data && typeof data === 'object' && 'success' in data) {
        if (!data.success) {
          throw new ApiError(response.status, {
            code: data.code || 'API_ERROR',
            message: data.message || 'Operation failed',
            errors: data.errors,
          });
        }
        return data.data !== undefined ? data.data : (data as unknown as T);
      }

      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error.name === 'AbortError') {
        throw new ApiError(408, {
          code: 'REQUEST_TIMEOUT',
          message: 'The request took too long to complete. Please try again.',
        });
      }

      // Connection failure
      this.setServerStatus(false);
      throw new ApiError(0, {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to StockSense server. Check your connection or verify backend is running.',
>>>>>>> e5898a935da6d61920e1ab01dc90bd3dfb05bc54
      });
    }
  }

<<<<<<< HEAD
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
=======
  // --- Automatic Token Refresh Queue ---

  private async handleTokenRefresh(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push((token: string) => resolve(token || null));
      });
    }

    this.isRefreshing = true;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        this.clearSession();
        this.flushRefreshSubscribers('');
        return null;
      }

      const json = await res.json();
      if (json.success && json.data) {
        const session: AuthSession = json.data;
        this.setSession(session);
        this.flushRefreshSubscribers(session.accessToken);
        return session.accessToken;
      }

      this.clearSession();
      this.flushRefreshSubscribers('');
      return null;
    } catch {
      this.clearSession();
      this.flushRefreshSubscribers('');
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  private flushRefreshSubscribers(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  // --- Shorthands ---

  public get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
>>>>>>> e5898a935da6d61920e1ab01dc90bd3dfb05bc54
