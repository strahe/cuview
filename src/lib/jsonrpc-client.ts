export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params: unknown[];
  id: number;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  result?: T;
  error?: JsonRpcError;
  id: number;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcClientOptions {
  endpoint?: string;
  timeout?: number;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  methodPrefix?: string;
}

export interface JsonRpcClientEvents {
  connected: () => void;
  disconnected: () => void;
  error: (error: Error) => void;
  reconnecting: (attempt: number) => void;
}

export class JsonRpcClient {
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<
    number,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  private readonly config: Required<JsonRpcClientOptions>;

  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isDestroyed = false;

  private events: Partial<JsonRpcClientEvents> = {};

  constructor(options: JsonRpcClientOptions = {}) {
    this.config = {
      endpoint: options.endpoint || "/api/webrpc/v0",
      timeout: options.timeout || 60000,
      reconnectInterval: options.reconnectInterval || 1000,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
      methodPrefix: options.methodPrefix || "",
    };
  }

  on<K extends keyof JsonRpcClientEvents>(
    event: K,
    callback: JsonRpcClientEvents[K],
  ): void {
    this.events[event] = callback;
  }

  off<K extends keyof JsonRpcClientEvents>(event: K): void {
    delete this.events[event];
  }

  async connect(): Promise<void> {
    if (this.isDestroyed) {
      throw new Error("Client has been destroyed");
    }

    return new Promise((resolve, reject) => {
      try {
        // If endpoint is a complete URL, use it directly; otherwise, construct it
        const wsUrl =
          this.config.endpoint.startsWith("ws://") ||
          this.config.endpoint.startsWith("wss://")
            ? this.config.endpoint
            : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}${this.config.endpoint}`;

        this.ws = new WebSocket(wsUrl);

        const onOpen = () => {
          console.log(`JSON-RPC WebSocket connected to ${wsUrl}`);
          this.reconnectAttempts = 0;
          this.events.connected?.();
          resolve();
        };

        const onError = (event: Event) => {
          console.error("JSON-RPC WebSocket connection failed:", event);
          const error = new Error("WebSocket connection failed");
          this.events.error?.(error);
          reject(error);
        };

        const onClose = (event: CloseEvent) => {
          console.log(
            `JSON-RPC WebSocket disconnected: ${event.code} ${event.reason}`,
          );
          this.events.disconnected?.();
          this.rejectAllPending(new Error("WebSocket disconnected"));

          if (event.code !== 1000 && !this.isDestroyed) {
            this.scheduleReconnect();
          }
        };

        const onMessage = (event: MessageEvent) => {
          this.handleMessage(event);
        };

        this.ws.addEventListener("open", onOpen, { once: true });
        this.ws.addEventListener("error", onError, { once: true });
        this.ws.addEventListener("close", onClose);
        this.ws.addEventListener("message", onMessage);
      } catch (error) {
        reject(error);
      }
    });
  }

  async call<T = unknown>(method: string, params: unknown[] = []): Promise<T> {
    // Debug network simulation (only in development)
    if (import.meta.env.DEV) {
      const { useDebugStore } = await import("../stores/debug");
      const debugStore = useDebugStore();

      // Simulate network offline
      if (debugStore.shouldRejectRequest()) {
        throw new Error("Network offline (debug simulation)");
      }

      // Simulate network delay
      const delay = debugStore.getNetworkDelay();
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (!this.isConnected) {
      throw new Error("WebSocket is not connected");
    }

    const id = ++this.requestId;

    const fullMethod = this.config.methodPrefix
      ? `${this.config.methodPrefix}${method}`
      : method;

    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      method: fullMethod,
      params,
      id,
    };

    return new Promise<T>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, this.config.timeout);

      this.pendingRequests.set(id, {
        resolve: (result: unknown) => {
          clearTimeout(timeoutHandle);
          resolve(result as T);
        },
        reject: (error: Error) => {
          clearTimeout(timeoutHandle);
          reject(error);
        },
        timeout: timeoutHandle,
      });

      try {
        this.ws!.send(JSON.stringify(request));
      } catch (error) {
        this.pendingRequests.delete(id);
        clearTimeout(timeoutHandle);
        reject(error);
      }
    });
  }

  notify(method: string, params: unknown[] = []): void {
    if (!this.isConnected) {
      console.warn("Cannot send notification: WebSocket is not connected");
      return;
    }

    const fullMethod = this.config.methodPrefix
      ? `${this.config.methodPrefix}${method}`
      : method;

    const notification = {
      jsonrpc: "2.0" as const,
      method: fullMethod,
      params,
      id: null,
    };

    try {
      this.ws!.send(JSON.stringify(notification));
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }

  // check connection status
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // get options
  get options(): Readonly<Required<JsonRpcClientOptions>> {
    return { ...this.config };
  }

  get pendingRequestCount(): number {
    return this.pendingRequests.size;
  }

  disconnect(): void {
    this.isDestroyed = true;
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.rejectAllPending(new Error("Client disconnected"));
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const response: JsonRpcResponse = JSON.parse(event.data);

      if (typeof response.id === "undefined") {
        // This is a notification or server push message, you can handle it here
        console.log("Received notification:", response);
        return;
      }

      const pending = this.pendingRequests.get(response.id);
      if (pending) {
        this.pendingRequests.delete(response.id);

        if (response.error) {
          const error = new Error(response.error.message) as Error & {
            code: number;
            data?: unknown;
          };
          error.code = response.error.code;
          error.data = response.error.data;
          pending.reject(error);
        } else {
          pending.resolve(response.result);
        }
      }
    } catch (error) {
      console.error("Failed to parse JSON-RPC message:", error);
    }
  }

  private scheduleReconnect(): void {
    if (
      this.isDestroyed ||
      this.reconnectAttempts >= this.config.maxReconnectAttempts
    ) {
      console.log("Max reconnect attempts reached or client destroyed");
      return;
    }

    this.clearReconnectTimer();

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      30000, // Max delay in milliseconds, default is 30 seconds
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(
        `Reconnecting... (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`,
      );

      this.events.reconnecting?.(this.reconnectAttempts);

      this.connect().catch((error) => {
        console.error("Reconnection failed:", error);
        this.events.error?.(error);
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private rejectAllPending(error: Error): void {
    for (const [, pending] of this.pendingRequests.entries()) {
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }
}

export function createJsonRpcClient(
  options?: JsonRpcClientOptions,
): JsonRpcClient {
  return new JsonRpcClient(options);
}
