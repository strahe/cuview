const DEFAULT_HOST = "localhost:4701";
export const DEFAULT_RPC_PATH = "/api/webrpc/v0";

const normalizePath = (path: string): string => {
  return path.replace(/\/+$/, "").replace(/^$/, "/");
};

const pathsEqual = (pathA: string, pathB: string): boolean => {
  return normalizePath(pathA) === normalizePath(pathB);
};

const ensureRpcPath = (url: URL) => {
  if (!url.pathname || pathsEqual(url.pathname, "/")) {
    url.pathname = DEFAULT_RPC_PATH;
  }
};

export const DEFAULT_ENDPOINT = `ws://${DEFAULT_HOST}${DEFAULT_RPC_PATH}`;

export const normalizeEndpoint = (endpoint: string): string => {
  const value = endpoint.trim();
  if (!value) return value;

  if (value.startsWith("/")) {
    if (value === "/") {
      return DEFAULT_RPC_PATH;
    }
    return value;
  }

  try {
    const url = new URL(value);

    if (url.protocol === "http:" || url.protocol === "https:") {
      ensureRpcPath(url);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      return url.toString();
    }

    if (url.protocol === "ws:" || url.protocol === "wss:") {
      ensureRpcPath(url);
      return url.toString();
    }

    return value;
  } catch {
    return value;
  }
};

export const formatEndpointForDisplay = (endpoint: string): string => {
  const value = endpoint.trim();
  if (!value) return "";

  if (value.startsWith("/")) {
    if (value === "/") {
      return DEFAULT_RPC_PATH;
    }
    return value;
  }

  try {
    const url = new URL(value);

    if (url.protocol === "ws:" || url.protocol === "wss:") {
      const scheme = url.protocol === "wss:" ? "https" : "http";
      const origin = `${scheme}://${url.host}`;
      const path = url.pathname ?? "/";
      const search = url.search ?? "";
      const hash = url.hash ?? "";

      if (pathsEqual(path, DEFAULT_RPC_PATH) && !search && !hash) {
        return origin;
      }

      return `${origin}${pathsEqual(path, "/") ? "" : path}${search}${hash}`;
    }

    if (url.protocol === "http:" || url.protocol === "https:") {
      const path = url.pathname ?? "/";
      const search = url.search ?? "";
      const hash = url.hash ?? "";

      if (pathsEqual(path, "/")) {
        return `${url.origin}${search}${hash}`;
      }

      if (pathsEqual(path, DEFAULT_RPC_PATH) && !search && !hash) {
        return url.origin;
      }

      return `${url.origin}${path}${search}${hash}`;
    }

    return value;
  } catch {
    return value;
  }
};
