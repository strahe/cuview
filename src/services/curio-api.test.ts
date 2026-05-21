import { beforeEach, describe, expect, it, vi } from "vitest";
import { RestClientNetworkError } from "@/lib/rest-client";
import { CurioApiService } from "./curio-api";

const { restGetMock } = vi.hoisted(() => ({
  restGetMock: vi.fn(),
}));

vi.mock("@/lib/jsonrpc-client", () => ({
  createJsonRpcClient: () => ({
    call: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    get isConnected() {
      return true;
    },
    off: vi.fn(),
    on: vi.fn(),
  }),
}));

vi.mock("@/lib/rest-client", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/rest-client")>(
      "@/lib/rest-client",
    );

  return {
    ...actual,
    createRestClient: () => ({
      get: restGetMock,
    }),
  };
});

describe("CurioApiService REST access errors", () => {
  beforeEach(() => {
    restGetMock.mockReset();
  });

  it("converts REST GET network failures into Curio REST access errors", async () => {
    restGetMock.mockRejectedValue(
      new RestClientNetworkError(
        "Request to http://curio.local/api/config/layers failed",
        "http://curio.local/api/config/layers",
        new TypeError("Failed to fetch"),
      ),
    );

    const api = new CurioApiService({
      endpoint: "ws://curio.local/api/webrpc/v0",
    });

    await expect(api.restGet("/api/config/layers")).rejects.toMatchObject({
      message: "Curio REST blocked.",
      name: "CurioRestAccessError",
    });
    await expect(api.restGet("/api/config/layers")).rejects.not.toBeInstanceOf(
      RestClientNetworkError,
    );
  });
});
