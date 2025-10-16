import { JsonRpcClient, createJsonRpcClient } from "@/lib/jsonrpc-client";
import type { JsonRpcClientEvents } from "@/lib/jsonrpc-client";
import { createRestClient, type RestClient } from "@/lib/rest-client";
import { useConfigStore } from "@/stores/config";

export class CurioApiService {
  private client: JsonRpcClient;
  private restClient: RestClient;

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
    this.restClient = createRestClient({
      baseURL: this.deriveRestBaseURL(endpoint),
      timeout: options?.timeout || 30000,
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

  async restGet<T = unknown>(
    path: string,
    options?: Parameters<RestClient["get"]>[1],
  ): Promise<T> {
    const response = await this.restClient.get<T>(path, options);
    return response.data;
  }

  async restPost<T = unknown>(
    path: string,
    body?: unknown,
    options?: Parameters<RestClient["post"]>[2],
  ): Promise<T> {
    const response = await this.restClient.post<T>(path, body, options);
    return response.data;
  }

  private deriveRestBaseURL(endpoint: string): string {
    let target = endpoint;

    if (/^wss?:\/\//i.test(target)) {
      target = target.replace(/^ws/i, "http");
    } else if (!/^https?:\/\//i.test(target)) {
      const origin =
        typeof window !== "undefined" && window.location
          ? window.location.origin
          : "http://localhost";
      target = `${origin}${target.startsWith("/") ? target : `/${target}`}`;
    }

    const url = new URL(target);
    const protocol =
      url.protocol === "https:" || url.protocol === "http:"
        ? url.protocol
        : url.protocol === "wss:"
          ? "https:"
          : "http:";

    return `${protocol}//${url.host}`;
  }
}
