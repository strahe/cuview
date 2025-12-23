import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { CurioApiService } from "@/services/curio-api";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

interface CurioApiContextValue {
  api: CurioApiService;
  status: ConnectionStatus;
  reconnectAttempt: number;
}

const CurioApiContext = createContext<CurioApiContextValue | null>(null);

const ENDPOINT_STORAGE_KEY = "cuview-endpoint";
const DEFAULT_ENDPOINT = "ws://localhost:4701/api/webrpc/v0";

export function getStoredEndpoint(): string {
  return localStorage.getItem(ENDPOINT_STORAGE_KEY) || "";
}

export function setStoredEndpoint(endpoint: string): void {
  localStorage.setItem(ENDPOINT_STORAGE_KEY, endpoint.trim());
}

export function isEndpointConfigured(): boolean {
  return getStoredEndpoint().trim() !== "";
}

export function CurioApiProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const apiRef = useRef<CurioApiService | null>(null);

  const getApi = useCallback(() => {
    if (!apiRef.current) {
      const endpoint = getStoredEndpoint() || DEFAULT_ENDPOINT;
      apiRef.current = new CurioApiService({ endpoint });
    }
    return apiRef.current;
  }, []);

  useEffect(() => {
    const api = getApi();

    api.on("connected", () => {
      setStatus("connected");
      setReconnectAttempt(0);
    });
    api.on("disconnected", () => setStatus("disconnected"));
    api.on("reconnecting", (attempt) => {
      setStatus("reconnecting");
      setReconnectAttempt(attempt);
    });
    api.on("error", (err) => {
      console.error("Curio API error:", err);
    });

    api.connect().catch(() => {
      setStatus("disconnected");
    });

    return () => {
      api.disconnect();
      apiRef.current = null;
    };
  }, [getApi]);

  const api = getApi();

  return (
    <CurioApiContext.Provider value={{ api, status, reconnectAttempt }}>
      {children}
    </CurioApiContext.Provider>
  );
}

export function useCurioApi(): CurioApiService {
  const ctx = useContext(CurioApiContext);
  if (!ctx) {
    throw new Error("useCurioApi must be used within CurioApiProvider");
  }
  return ctx.api;
}

export function useConnectionStatus(): ConnectionStatus {
  const ctx = useContext(CurioApiContext);
  if (!ctx) {
    throw new Error(
      "useConnectionStatus must be used within CurioApiProvider",
    );
  }
  return ctx.status;
}

export function useReconnectAttempt(): number {
  const ctx = useContext(CurioApiContext);
  if (!ctx) {
    throw new Error(
      "useReconnectAttempt must be used within CurioApiProvider",
    );
  }
  return ctx.reconnectAttempt;
}
