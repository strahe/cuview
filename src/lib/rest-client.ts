export interface RestClientOptions {
  baseURL: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  credentials?: RequestCredentials;
}

export interface RestRequestOptions {
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  timeout?: number;
  body?: unknown;
}

export interface RestResponse<T> {
  status: number;
  headers: Headers;
  data: T;
}

export class RestClientError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly response?: unknown;

  constructor(
    message: string,
    status: number,
    statusText: string,
    response?: unknown,
  ) {
    super(message);
    this.name = "RestClientError";
    this.status = status;
    this.statusText = statusText;
    this.response = response;
  }
}

export interface RestClient {
  get<T>(path: string, options?: RestRequestOptions): Promise<RestResponse<T>>;
  delete<T>(
    path: string,
    options?: RestRequestOptions,
  ): Promise<RestResponse<T>>;
  post<T>(
    path: string,
    body?: unknown,
    options?: RestRequestOptions,
  ): Promise<RestResponse<T>>;
  put<T>(
    path: string,
    body?: unknown,
    options?: RestRequestOptions,
  ): Promise<RestResponse<T>>;
  patch<T>(
    path: string,
    body?: unknown,
    options?: RestRequestOptions,
  ): Promise<RestResponse<T>>;
  request<T>(
    method: string,
    path: string,
    options?: RestRequestOptions,
  ): Promise<RestResponse<T>>;
}

function buildURL(
  baseURL: string,
  path: string,
  query?: RestRequestOptions["query"],
) {
  const url = new URL(path, baseURL);

  if (query) {
    Object.entries(query)
      .filter(([, value]) => value !== undefined)
      .forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
  }

  return url.toString();
}

async function parseJSON<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

function mergeAbortSignals(timeout?: number, signal?: AbortSignal) {
  if (!timeout) return signal;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const clear = () => clearTimeout(timer);

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      clear();
    } else {
      signal.addEventListener("abort", () => {
        controller.abort(signal.reason);
        clear();
      });
    }
  }

  controller.signal.addEventListener("abort", clear, { once: true });

  return controller.signal;
}

export function createRestClient({
  baseURL,
  timeout,
  defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  credentials = "same-origin",
}: RestClientOptions): RestClient {
  const normalizedBaseURL = baseURL.endsWith("/")
    ? baseURL.slice(0, -1)
    : baseURL;

  async function execute<T>(
    method: string,
    path: string,
    options: RestRequestOptions = {},
  ): Promise<RestResponse<T>> {
    const { headers, query, signal, timeout: requestTimeout, body } = options;
    const url = buildURL(normalizedBaseURL, path, query);
    const mergedHeaders = {
      ...defaultHeaders,
      ...(headers || {}),
    };

    const init: RequestInit = {
      method,
      headers: mergedHeaders,
      credentials,
      signal: mergeAbortSignals(requestTimeout ?? timeout, signal),
    };

    if (body !== undefined) {
      if (
        body instanceof FormData ||
        body instanceof Blob ||
        body instanceof ArrayBuffer
      ) {
        init.body = body as BodyInit;
      } else if (mergedHeaders["Content-Type"] === "application/json") {
        init.body = JSON.stringify(body);
      } else {
        init.body = body as BodyInit;
      }
    }

    const response = await fetch(url, init);

    const data = await parseJSON<T>(response);

    if (!response.ok) {
      throw new RestClientError(
        `Request to ${url} failed`,
        response.status,
        response.statusText,
        data,
      );
    }

    return {
      status: response.status,
      headers: response.headers,
      data,
    };
  }

  return {
    request: execute,
    get: (path, options) => execute("GET", path, options),
    delete: (path, options) => execute("DELETE", path, options),
    post: (path, body, options) => execute("POST", path, { ...options, body }),
    put: (path, body, options) => execute("PUT", path, { ...options, body }),
    patch: (path, body, options) =>
      execute("PATCH", path, { ...options, body }),
  };
}
