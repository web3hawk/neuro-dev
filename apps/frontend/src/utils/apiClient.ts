/*
  A simple fetch-based API client for backend service calls without axios.
  Usage examples:
    import api from '@/utils/apiClient';

    // GET with query params
    const res = await api.get('/api/projects', { page: 1 });

    // POST JSON
    const res2 = await api.post('/api/projects', { name: 'demo' });

    // You can also create your own instance with a different baseURL or headers
    const custom = new ApiClient({ baseURL: '/api', headers: { 'X-Source': 'frontend' } });
*/

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiClientOptions {
  baseURL?: string;
  headers?: Record<string, string>;
  timeoutMs?: number; // default 30000
  // Whether to automatically stringify/parse JSON
  json?: boolean; // default true
}

export interface RequestOptions extends RequestInit {
  // Query parameters for GET/DELETE etc.
  params?: Record<string, any> | URLSearchParams;
  // Override default timeout for this request
  timeoutMs?: number;
  // If set, app-level success checking: e.g., { field: 'success', okValues: [true] }
  successCheck?: {
    field: string;
    okValues?: any[];
  };
}

export interface ApiResponse<T = any> {
  ok: boolean;          // HTTP-level success (status 2xx)
  status: number;       // HTTP status code
  data: T | null;       // Parsed JSON data or null
  raw: Response;        // Raw fetch Response
}

function buildQuery(params?: Record<string, any> | URLSearchParams): string {
  if (!params) return '';
  if (params instanceof URLSearchParams) {
    const s = params.toString();
    return s ? `?${s}` : '';
  }
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      v.forEach(item => usp.append(k, String(item)));
    } else if (typeof v === 'object') {
      usp.append(k, JSON.stringify(v));
    } else {
      usp.append(k, String(v));
    }
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export class ApiClient {
  private baseURL?: string;
  private defaultHeaders: Record<string, string>;
  private timeoutMs: number;
  private json: boolean;

  constructor(options: ApiClientOptions = {}) {
    this.baseURL = options.baseURL;
    this.defaultHeaders = options.headers || {};
    this.timeoutMs = options.timeoutMs ?? 30000;
    this.json = options.json ?? true;
  }

  setHeader(key: string, value: string | undefined) {
    if (value === undefined) {
      delete this.defaultHeaders[key];
    } else {
      this.defaultHeaders[key] = value;
    }
  }

  async request<T = any>(path: string, method: HttpMethod, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { params, timeoutMs, successCheck, headers, body, ...rest } = options;

    const url = `${this.baseURL ? this.baseURL.replace(/\/$/, '') : ''}${path}${buildQuery(params)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs ?? this.timeoutMs);

    const finalHeaders: HeadersInit = {
      ...(this.json ? { 'Content-Type': 'application/json' } : {}),
      ...this.defaultHeaders,
      ...(headers || {})
    };

    const init: RequestInit = {
      method,
      headers: finalHeaders,
      signal: controller.signal,
      ...rest
    };

    if (body !== undefined && body !== null) {
      init.body = this.json && typeof body !== 'string' ? JSON.stringify(body) : (body as any);
    }

    let resp: Response;
    try {
      resp = await fetch(url, init);
    } catch (e: any) {
      clearTimeout(timer);
      // Normalize network/abort errors into a consistent ApiResponse
      return {
        ok: false,
        status: 0,
        data: null,
        raw: new Response(null, { status: 0, statusText: e?.name || 'NetworkError' })
      };
    } finally {
      clearTimeout(timer);
    }

    let data: any = null;
    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try { data = await resp.json(); } catch (_) { data = null; }
    } else if (contentType.includes('text/')) {
      try { data = await resp.text(); } catch (_) { data = null; }
    } else {
      // Leave as null (caller can use resp.blob() if they need)
    }

    const result: ApiResponse<T> = {
      ok: resp.ok,
      status: resp.status,
      data: data as T,
      raw: resp
    };

    // Optional application-level success checking (e.g., { success: true })
    if (successCheck && data && typeof data === 'object') {
      const val = (data as any)[successCheck.field];
      const okValues = successCheck.okValues ?? [true, 'true', 1, '1'];
      if (!okValues.includes(val)) {
        return { ...result, ok: false };
      }
    }

    return result;
  }

  get<T = any>(path: string, params?: RequestOptions['params'], options: RequestOptions = {}) {
    return this.request<T>(path, 'GET', { ...options, params });
  }

  post<T = any>(path: string, body?: any, options: RequestOptions = {}) {
    return this.request<T>(path, 'POST', { ...options, body });
  }

  put<T = any>(path: string, body?: any, options: RequestOptions = {}) {
    return this.request<T>(path, 'PUT', { ...options, body });
  }

  patch<T = any>(path: string, body?: any, options: RequestOptions = {}) {
    return this.request<T>(path, 'PATCH', { ...options, body });
  }

  delete<T = any>(path: string, params?: RequestOptions['params'], options: RequestOptions = {}) {
    return this.request<T>(path, 'DELETE', { ...options, params });
  }
}

// Default client instance. With CRA proxy in package.json, relative /api works.
const api = new ApiClient();
export default api;
