import { afterEach, describe, expect, it, vi } from "vitest";
import { createJsonRpcClient } from "@/lib/jsonrpc-client";

type ListenerEntry = {
  listener: EventListenerOrEventListenerObject;
  once: boolean;
};

class MockCloseEvent extends Event {
  code: number;

  constructor(code: number) {
    super("close");
    this.code = code;
  }
}

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  static instances: MockWebSocket[] = [];
  static nextCloseCode: number | null = null;

  readonly url: string;
  readyState = MockWebSocket.CONNECTING;

  private listeners: Record<string, ListenerEntry[]> = {};

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);

    queueMicrotask(() => {
      this.readyState = MockWebSocket.OPEN;
      this.emit("open", new Event("open"));
    });
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ): void {
    const once = (typeof options === "object" && options?.once) ?? false;

    const bucket = this.listeners[type] ?? [];
    bucket.push({ listener, once });
    this.listeners[type] = bucket;
  }

  send(): void {}

  close(code = 1000): void {
    const closeCode = MockWebSocket.nextCloseCode ?? code;
    MockWebSocket.nextCloseCode = null;
    this.readyState = MockWebSocket.CLOSED;
    this.emit("close", new MockCloseEvent(closeCode));
  }

  private emit(type: string, event: Event): void {
    const bucket = this.listeners[type];
    if (!bucket || bucket.length === 0) {
      return;
    }

    for (const entry of [...bucket]) {
      if (typeof entry.listener === "function") {
        entry.listener(event);
      } else {
        entry.listener.handleEvent(event);
      }

      if (entry.once) {
        const target = this.listeners[type];
        if (!target) {
          continue;
        }
        this.listeners[type] = target.filter((item) => item !== entry);
      }
    }
  }
}

describe("JsonRpcClient reconnect behavior", () => {
  afterEach(() => {
    MockWebSocket.instances = [];
    MockWebSocket.nextCloseCode = null;
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("allows reconnecting after an explicit disconnect", async () => {
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);

    const client = createJsonRpcClient({
      endpoint: "ws://localhost:4701/api/webrpc/v0",
      maxReconnectAttempts: 0,
      reconnectInterval: 0,
    });

    await client.connect();
    expect(client.isConnected).toBe(true);

    client.disconnect();
    expect(client.isConnected).toBe(false);

    await expect(client.connect()).resolves.toBeUndefined();
    expect(client.isConnected).toBe(true);
    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it("does not auto reconnect after explicit disconnect on abnormal close", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);

    const client = createJsonRpcClient({
      endpoint: "ws://localhost:4701/api/webrpc/v0",
      maxReconnectAttempts: 3,
      reconnectInterval: 10,
    });

    await client.connect();
    expect(client.isConnected).toBe(true);
    expect(MockWebSocket.instances).toHaveLength(1);

    MockWebSocket.nextCloseCode = 1006;
    client.disconnect();
    expect(client.isConnected).toBe(false);

    await vi.advanceTimersByTimeAsync(100);
    expect(MockWebSocket.instances).toHaveLength(1);
  });
});
