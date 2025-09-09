export interface RestClientOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface RestResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export class RestClient {
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: RestClientOptions = {}) {
    this.baseURL = options.baseURL || "";
    this.timeout = options.timeout || 30000;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...options.headers,
    };
  }

  private async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestInit = {},
  ): Promise<RestResponse<T>> {
    const url = `${this.baseURL}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      let data: T;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = (await response.text()) as T;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  async get<T = unknown>(
    path: string,
    options?: RequestInit,
  ): Promise<RestResponse<T>> {
    return this.request<T>("GET", path, undefined, options);
  }

  async post<T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<RestResponse<T>> {
    return this.request<T>("POST", path, body, options);
  }

  async put<T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<RestResponse<T>> {
    return this.request<T>("PUT", path, body, options);
  }

  async delete<T = unknown>(
    path: string,
    options?: RequestInit,
  ): Promise<RestResponse<T>> {
    return this.request<T>("DELETE", path, undefined, options);
  }

  async patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<RestResponse<T>> {
    return this.request<T>("PATCH", path, body, options);
  }
}

export function createRestClient(options?: RestClientOptions): RestClient {
  return new RestClient(options);
}
