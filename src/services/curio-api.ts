import { JsonRpcClient, createJsonRpcClient } from "@/lib/jsonrpc-client";
import type { JsonRpcClientEvents } from "@/lib/jsonrpc-client";
import { useConfigStore } from "@/stores/config";

export class CurioApiService {
  private client: JsonRpcClient;

  constructor(options?: { endpoint?: string; timeout?: number }) {
    const configStore = useConfigStore();
    const endpoint = options?.endpoint || configStore.getEndpoint();
    
    this.client = createJsonRpcClient({
      endpoint,
      timeout: options?.timeout || 30000,
      methodPrefix: "CurioWeb.",
      reconnectInterval: 1000,
      maxReconnectAttempts: 10,
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
}
