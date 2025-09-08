import { JsonRpcClient, createJsonRpcClient } from "@/lib/jsonrpc-client";
import type { JsonRpcClientEvents } from "@/lib/jsonrpc-client";
import { useConfigStore } from "@/stores/config";

export class CurioApiService {
  private client: JsonRpcClient;

  constructor(options?: {
    endpoint?: string;
    timeout?: number;
    enableAutoReconnect?: boolean;
  }) {
    const configStore = useConfigStore();
    const endpoint = options?.endpoint || configStore.getEndpoint();

    const enableAutoReconnect = options?.enableAutoReconnect ?? true;

    this.client = createJsonRpcClient({
      endpoint,
      timeout: options?.timeout || 30000,
      methodPrefix: "CurioWeb.",
      reconnectInterval: enableAutoReconnect ? 1000 : 0,
      maxReconnectAttempts: enableAutoReconnect ? 10 : 0,
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  disconnect(): void {
    this.client.disconnect();
  }

  get isConnected(): boolean {
    return this.client.isConnected;
  }

  on<K extends keyof JsonRpcClientEvents>(
    event: K,
    callback: JsonRpcClientEvents[K],
  ): void {
    this.client.on(event, callback);
  }

  async call<T = unknown>(method: string, params: unknown[] = []): Promise<T> {
    return this.client.call<T>(method, params);
  }

  // HTTP API method to match Curio's built-in UI
  async fetchSectorsAll(): Promise<unknown> {
    const configStore = useConfigStore();
    const endpoint = configStore.getEndpoint();

    // Convert WebSocket endpoint to HTTP
    const httpEndpoint = endpoint
      .replace("ws://", "http://")
      .replace("wss://", "https://");
    const baseUrl = httpEndpoint.replace("/api/webrpc/v0", "");
    const url = `${baseUrl}/api/sector/all`;

    console.log("Fetching sectors from:", url);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add credentials if needed for CORS
        credentials: "same-origin",
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch sectors: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("Sectors data received:", data);
      return data;
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  }
}
