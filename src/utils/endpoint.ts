const DEFAULT_HOST = "localhost:4701";
export const DEFAULT_RPC_PATH = "/api/webrpc/v0";

export const isValidHost = (host: string): boolean => {
  if (!host) return false;
  const m = /^([a-zA-Z0-9._-]+|\[[a-fA-F0-9:]+\])(?::(\d{1,5}))?$/.exec(host);
  if (!m) return false;
  if (m[2] !== undefined && (Number(m[2]) < 1 || Number(m[2]) > 65535))
    return false;
  return true;
};

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

const formatAuthority = (url: URL, stripCredentials: boolean): string => {
  if (stripCredentials || !url.username) return url.host;
  const password = url.password ? `:${url.password}` : "";
  return `${url.username}${password}@${url.host}`;
};

const formatEndpoint = (
  endpoint: string,
  options: { stripCredentials: boolean },
): string => {
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
    if (options.stripCredentials) {
      url.username = "";
      url.password = "";
    }

    if (url.protocol === "ws:" || url.protocol === "wss:") {
      const scheme = url.protocol === "wss:" ? "https" : "http";
      const origin = `${scheme}://${formatAuthority(url, options.stripCredentials)}`;
      const path = url.pathname ?? "/";
      const search = url.search ?? "";
      const hash = url.hash ?? "";

      if (pathsEqual(path, DEFAULT_RPC_PATH) && !search && !hash) {
        return origin;
      }

      return `${origin}${pathsEqual(path, "/") ? "" : path}${search}${hash}`;
    }

    if (url.protocol === "http:" || url.protocol === "https:") {
      const origin = `${url.protocol}//${formatAuthority(url, options.stripCredentials)}`;
      const path = url.pathname ?? "/";
      const search = url.search ?? "";
      const hash = url.hash ?? "";

      if (pathsEqual(path, "/")) {
        return `${origin}${search}${hash}`;
      }

      if (pathsEqual(path, DEFAULT_RPC_PATH) && !search && !hash) {
        return origin;
      }

      return `${origin}${path}${search}${hash}`;
    }

    return url.toString();
  } catch {
    return value;
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
  return formatEndpoint(endpoint, { stripCredentials: true });
};

export const formatEndpointForInput = (endpoint: string): string => {
  return formatEndpoint(endpoint, { stripCredentials: false });
};
