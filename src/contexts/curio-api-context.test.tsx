import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CurioApiProvider,
  useCurioConnection,
} from "@/contexts/curio-api-context";

const { testEndpointConnectionMock, MockCurioApiService } = vi.hoisted(() => {
  const testEndpointConnection = vi.fn();

  class MockCurioApiServiceClass {
    static instances: MockCurioApiServiceClass[] = [];

    endpoint: string;
    private events: Record<string, ((...args: unknown[]) => void) | undefined> =
      {};

    connect = vi.fn(async () => {
      this.events.connected?.();
    });

    disconnect = vi.fn(() => undefined);

    constructor(options?: { endpoint?: string }) {
      this.endpoint = options?.endpoint ?? "";
      MockCurioApiServiceClass.instances.push(this);
    }

    on(event: string, callback: (...args: unknown[]) => void) {
      this.events[event] = callback;
    }

    emit(event: string, ...args: unknown[]) {
      this.events[event]?.(...args);
    }

    off(event: string) {
      delete this.events[event];
    }

    call = vi.fn(async () => undefined);
    restGet = vi.fn(async () => undefined);
    restPost = vi.fn(async () => undefined);
  }

  return {
    testEndpointConnectionMock: testEndpointConnection,
    MockCurioApiService: MockCurioApiServiceClass,
  };
});

const storageData = new Map<string, string>();
const localStorageMock: Storage = {
  get length() {
    return storageData.size;
  },
  clear() {
    storageData.clear();
  },
  getItem(key: string) {
    return storageData.get(key) ?? null;
  },
  key(index: number) {
    return Array.from(storageData.keys())[index] ?? null;
  },
  removeItem(key: string) {
    storageData.delete(key);
  },
  setItem(key: string, value: string) {
    storageData.set(key, value);
  },
};

vi.mock("@/services/curio-api", () => ({
  CurioApiService: MockCurioApiService,
}));

vi.mock("@/utils/test-connection", () => ({
  testEndpointConnection: testEndpointConnectionMock,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <CurioApiProvider>{children}</CurioApiProvider>
      </QueryClientProvider>
    );
  };
}

describe("CurioApiProvider endpoint switching", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      configurable: true,
    });
    storageData.clear();
    MockCurioApiService.instances.length = 0;
    testEndpointConnectionMock.mockReset();
  });

  it("switches endpoint after successful connection test", async () => {
    testEndpointConnectionMock.mockResolvedValue(true);

    const { result } = renderHook(() => useCurioConnection(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.status).toBe("connected");
    });

    await act(async () => {
      await result.current.testAndSwitchEndpoint("http://192.168.1.230:4701/");
    });

    await waitFor(() => {
      expect(result.current.endpoint).toBe(
        "ws://192.168.1.230:4701/api/webrpc/v0",
      );
    });

    expect(result.current.endpointHistory[0]).toBe(
      "ws://192.168.1.230:4701/api/webrpc/v0",
    );
    expect(localStorage.getItem("cuview-endpoint")).toBe(
      "ws://192.168.1.230:4701/api/webrpc/v0",
    );
    expect(MockCurioApiService.instances.length).toBeGreaterThan(1);
  });

  it("keeps current endpoint when test fails", async () => {
    localStorage.setItem(
      "cuview-endpoint",
      "ws://localhost:4701/api/webrpc/v0",
    );
    testEndpointConnectionMock.mockResolvedValue(false);

    const { result } = renderHook(() => useCurioConnection(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.status).toBe("connected");
    });

    const before = result.current.endpoint;

    let switchResult:
      | Awaited<ReturnType<typeof result.current.testAndSwitchEndpoint>>
      | undefined;
    await act(async () => {
      switchResult = await result.current.testAndSwitchEndpoint(
        "http://192.168.1.240:4701/",
      );
    });

    expect(switchResult).toEqual({
      ok: false,
      error: "Unable to connect to this endpoint.",
    });
    expect(result.current.endpoint).toBe(before);
    expect(result.current.endpointHistory).toEqual([before]);
  });

  it("keeps latest 5 unique successful endpoints", async () => {
    testEndpointConnectionMock.mockResolvedValue(true);

    const { result } = renderHook(() => useCurioConnection(), {
      wrapper: createWrapper(),
    });

    const endpoints = [230, 231, 232, 233, 234, 235].map(
      (n) => `http://192.168.1.${n}:4701/`,
    );

    for (const endpoint of endpoints) {
      await act(async () => {
        await result.current.testAndSwitchEndpoint(endpoint);
      });
    }

    await act(async () => {
      await result.current.testAndSwitchEndpoint("http://192.168.1.233:4701/");
    });

    expect(result.current.endpointHistory).toHaveLength(5);
    expect(result.current.endpointHistory[0]).toBe(
      "ws://192.168.1.233:4701/api/webrpc/v0",
    );
    expect(result.current.endpointHistory).not.toContain(
      "ws://192.168.1.230:4701/api/webrpc/v0",
    );
  });

  it("normalizes stored endpoint on initialization", async () => {
    localStorage.setItem("cuview-endpoint", "http://192.168.1.230:4701/");
    testEndpointConnectionMock.mockResolvedValue(true);

    const { result } = renderHook(() => useCurioConnection(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.endpoint).toBe(
        "ws://192.168.1.230:4701/api/webrpc/v0",
      );
    });

    expect(localStorage.getItem("cuview-endpoint")).toBe(
      "ws://192.168.1.230:4701/api/webrpc/v0",
    );
  });

  it("reconnects when switching to same endpoint while disconnected", async () => {
    localStorage.setItem(
      "cuview-endpoint",
      "ws://localhost:4701/api/webrpc/v0",
    );
    testEndpointConnectionMock.mockResolvedValue(true);

    const { result } = renderHook(() => useCurioConnection(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.status).toBe("connected");
    });

    const initialInstanceCount = MockCurioApiService.instances.length;
    const currentApi = MockCurioApiService.instances.at(-1);
    currentApi?.emit("disconnected");

    await waitFor(() => {
      expect(result.current.status).toBe("disconnected");
    });

    await act(async () => {
      await result.current.testAndSwitchEndpoint("http://localhost:4701/");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("connected");
    });

    expect(MockCurioApiService.instances.length).toBeGreaterThan(
      initialInstanceCount,
    );
  });

  it("rejects concurrent endpoint switch requests", async () => {
    localStorage.setItem(
      "cuview-endpoint",
      "ws://localhost:4701/api/webrpc/v0",
    );

    let resolveConnectionTest: ((value: boolean) => void) | undefined;
    testEndpointConnectionMock.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveConnectionTest = resolve;
        }),
    );

    const { result } = renderHook(() => useCurioConnection(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.status).toBe("connected");
    });

    let firstResult:
      | Awaited<ReturnType<typeof result.current.testAndSwitchEndpoint>>
      | undefined;
    let secondResult:
      | Awaited<ReturnType<typeof result.current.testAndSwitchEndpoint>>
      | undefined;

    await act(async () => {
      const firstPromise = result.current.testAndSwitchEndpoint(
        "http://192.168.1.230:4701/",
      );
      secondResult = await result.current.testAndSwitchEndpoint(
        "http://192.168.1.231:4701/",
      );

      resolveConnectionTest?.(true);
      firstResult = await firstPromise;
    });

    expect(secondResult).toEqual({
      ok: false,
      error: "Another endpoint switch is already in progress.",
    });
    expect(firstResult).toEqual({
      ok: true,
      endpoint: "ws://192.168.1.230:4701/api/webrpc/v0",
    });
  });
});
