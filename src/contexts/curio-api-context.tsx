import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CurioApiService } from "@/services/curio-api";
import { DEFAULT_ENDPOINT, normalizeEndpoint } from "@/utils/endpoint";
import { testEndpointConnection } from "@/utils/test-connection";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

export type EndpointSwitchResult =
  | { ok: true; endpoint: string }
  | { ok: false; error: string };

interface CurioApiContextValue {
  api: CurioApiService;
  status: ConnectionStatus;
  reconnectAttempt: number;
  endpoint: string;
  endpointHistory: string[];
  testAndSwitchEndpoint: (input: string) => Promise<EndpointSwitchResult>;
}

const CurioApiContext = createContext<CurioApiContextValue | null>(null);

const ENDPOINT_STORAGE_KEY = "cuview-endpoint";
const ENDPOINT_HISTORY_STORAGE_KEY = "cuview-endpoint-history";
const MAX_ENDPOINT_HISTORY = 5;

const addEndpointToHistory = (
  history: string[],
  endpoint: string,
): string[] => {
  const normalizedEndpoint = normalizeEndpoint(endpoint).trim();
  if (!normalizedEndpoint) {
    return history.slice(0, MAX_ENDPOINT_HISTORY);
  }

  return [
    normalizedEndpoint,
    ...history.filter((item) => item !== normalizedEndpoint),
  ].slice(0, MAX_ENDPOINT_HISTORY);
};

const sanitizeEndpointHistory = (value: string[]): string[] => {
  return value
    .map((item) => normalizeEndpoint(item).trim())
    .filter(
      (item, index, arr) => item.length > 0 && arr.indexOf(item) === index,
    )
    .slice(0, MAX_ENDPOINT_HISTORY);
};

export function getStoredEndpoint(): string {
  const rawValue = localStorage.getItem(ENDPOINT_STORAGE_KEY) || "";
  const normalized = normalizeEndpoint(rawValue).trim();

  if (!normalized) {
    return "";
  }

  if (normalized !== rawValue) {
    localStorage.setItem(ENDPOINT_STORAGE_KEY, normalized);
  }

  return normalized;
}

export function setStoredEndpoint(endpoint: string): void {
  const normalized = normalizeEndpoint(endpoint).trim();

  if (!normalized) {
    localStorage.removeItem(ENDPOINT_STORAGE_KEY);
    return;
  }

  localStorage.setItem(ENDPOINT_STORAGE_KEY, normalized);
}

export function getStoredEndpointHistory(): string[] {
  const rawValue = localStorage.getItem(ENDPOINT_HISTORY_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(ENDPOINT_HISTORY_STORAGE_KEY);
      return [];
    }

    const history = sanitizeEndpointHistory(
      parsed.filter((item): item is string => typeof item === "string"),
    );

    if (JSON.stringify(history) !== JSON.stringify(parsed)) {
      localStorage.setItem(
        ENDPOINT_HISTORY_STORAGE_KEY,
        JSON.stringify(history),
      );
    }

    return history;
  } catch {
    localStorage.removeItem(ENDPOINT_HISTORY_STORAGE_KEY);
    return [];
  }
}

export function setStoredEndpointHistory(history: string[]): void {
  const sanitized = sanitizeEndpointHistory(history);

  if (sanitized.length === 0) {
    localStorage.removeItem(ENDPOINT_HISTORY_STORAGE_KEY);
    return;
  }

  localStorage.setItem(ENDPOINT_HISTORY_STORAGE_KEY, JSON.stringify(sanitized));
}

export function isEndpointConfigured(): boolean {
  return getStoredEndpoint().trim() !== "";
}

const getInitialEndpoint = (): string => {
  return getStoredEndpoint() || DEFAULT_ENDPOINT;
};

const getInitialEndpointHistory = (currentEndpoint: string): string[] => {
  const history = getStoredEndpointHistory();

  if (isEndpointConfigured()) {
    return addEndpointToHistory(history, currentEndpoint);
  }

  return history;
};

export function CurioApiProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const initialEndpoint = getInitialEndpoint();
  const [endpoint, setEndpoint] = useState(initialEndpoint);
  const [endpointHistory, setEndpointHistory] = useState(() =>
    getInitialEndpointHistory(initialEndpoint),
  );
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [api, setApi] = useState(
    () => new CurioApiService({ endpoint: initialEndpoint }),
  );
  const isSwitchingEndpointRef = useRef(false);
  const refreshAfterSwitchRef = useRef(false);

  useEffect(() => {
    setStoredEndpointHistory(endpointHistory);
  }, [endpointHistory]);

  const refreshCurioQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["curio"],
        refetchType: "active",
      }),
      queryClient.invalidateQueries({
        queryKey: ["curio-rest"],
        refetchType: "active",
      }),
    ]);
  }, [queryClient]);

  useEffect(() => {
    let mounted = true;

    const handleConnected = () => {
      if (!mounted) {
        return;
      }

      setStatus("connected");
      setReconnectAttempt(0);

      if (refreshAfterSwitchRef.current) {
        refreshAfterSwitchRef.current = false;
        void refreshCurioQueries();
      }
    };

    const handleDisconnected = () => {
      if (mounted) {
        setStatus("disconnected");
      }
    };

    const handleReconnecting = (attempt: number) => {
      if (mounted) {
        setStatus("reconnecting");
        setReconnectAttempt(attempt);
      }
    };

    const handleError = (err: Error) => {
      console.error("Curio API error:", err);
    };

    api.on("connected", handleConnected);
    api.on("disconnected", handleDisconnected);
    api.on("reconnecting", handleReconnecting);
    api.on("error", handleError);

    setStatus("connecting");
    api.connect().catch(() => {
      if (mounted) {
        setStatus("disconnected");
      }
    });

    return () => {
      mounted = false;
      api.off("connected");
      api.off("disconnected");
      api.off("reconnecting");
      api.off("error");
      api.disconnect();
    };
  }, [api, refreshCurioQueries]);

  const testAndSwitchEndpoint = useCallback(
    async (input: string): Promise<EndpointSwitchResult> => {
      const normalizedEndpoint = normalizeEndpoint(input).trim();

      if (!normalizedEndpoint) {
        return { ok: false, error: "Endpoint is required." };
      }

      if (isSwitchingEndpointRef.current) {
        return {
          ok: false,
          error: "Another endpoint switch is already in progress.",
        };
      }

      isSwitchingEndpointRef.current = true;

      try {
        const canConnect = await testEndpointConnection(normalizedEndpoint);
        if (!canConnect) {
          return { ok: false, error: "Unable to connect to this endpoint." };
        }

        setStoredEndpoint(normalizedEndpoint);
        setEndpointHistory((prev) =>
          addEndpointToHistory(prev, normalizedEndpoint),
        );

        const shouldReconnect =
          normalizedEndpoint !== endpoint || status !== "connected";

        if (shouldReconnect) {
          refreshAfterSwitchRef.current = true;
          if (normalizedEndpoint !== endpoint) {
            setEndpoint(normalizedEndpoint);
          }
          setReconnectAttempt(0);
          setStatus("connecting");
          setApi(new CurioApiService({ endpoint: normalizedEndpoint }));
        }

        return { ok: true, endpoint: normalizedEndpoint };
      } finally {
        isSwitchingEndpointRef.current = false;
      }
    },
    [endpoint, status],
  );

  return (
    <CurioApiContext.Provider
      value={{
        api,
        status,
        reconnectAttempt,
        endpoint,
        endpointHistory,
        testAndSwitchEndpoint,
      }}
    >
      {children}
    </CurioApiContext.Provider>
  );
}

export function useCurioConnection(): CurioApiContextValue {
  const ctx = useContext(CurioApiContext);
  if (!ctx) {
    throw new Error("useCurioConnection must be used within CurioApiProvider");
  }
  return ctx;
}

export function useCurioApi(): CurioApiService {
  return useCurioConnection().api;
}

export function useConnectionStatus(): ConnectionStatus {
  return useCurioConnection().status;
}

export function useReconnectAttempt(): number {
  return useCurioConnection().reconnectAttempt;
}
