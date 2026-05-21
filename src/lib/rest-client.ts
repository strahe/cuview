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

export class RestClientNetworkError extends Error {
  readonly url: string;

  constructor(message: string, url: string, cause: unknown) {
    super(message, { cause });
    this.name = "RestClientNetworkError";
    this.url = url;
  }
}

interface MergedAbortSignal {
  signal?: AbortSignal;
  cleanup: () => void;
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

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

function getRestClientErrorMessage(data: unknown, url: string) {
  if (typeof data === "string" && data.trim().length > 0) {
    return data;
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string" &&
    data.message.trim().length > 0
  ) {
    return data.message;
  }

  return `Request to ${url} failed`;
}

function mergeAbortSignals(
  timeout?: number,
  signal?: AbortSignal,
): MergedAbortSignal {
  if (!timeout) {
    return { signal, cleanup: () => undefined };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const clear = () => clearTimeout(timer);
  const abortFromSignal = () => {
    controller.abort(signal?.reason);
    clear();
  };

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      clear();
    } else {
      signal.addEventListener("abort", abortFromSignal, { once: true });
    }
  }

  controller.signal.addEventListener("abort", clear, { once: true });

  return {
    signal: controller.signal,
    cleanup: () => {
      clear();
      signal?.removeEventListener("abort", abortFromSignal);
    },
  };
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
    const mergedSignal = mergeAbortSignals(requestTimeout ?? timeout, signal);
    const mergedHeaders = {
      ...defaultHeaders,
      ...(headers || {}),
    };

    const init: RequestInit = {
      method,
      headers: mergedHeaders,
      credentials,
      signal: mergedSignal.signal,
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

    try {
      let response: Response;
      try {
        response = await fetch(url, init);
      } catch (err) {
        if (isAbortError(err) || init.signal?.aborted) {
          throw err;
        }
        throw new RestClientNetworkError(`Request to ${url} failed`, url, err);
      }

      const data = await parseJSON<T>(response);

      if (!response.ok) {
        throw new RestClientError(
          getRestClientErrorMessage(data, url),
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
    } finally {
      mergedSignal.cleanup();
    }
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
