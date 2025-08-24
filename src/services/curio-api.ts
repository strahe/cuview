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
}
