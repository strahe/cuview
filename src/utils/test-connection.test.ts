import { beforeEach, describe, expect, it, vi } from "vitest";
import { testEndpointConnection } from "@/utils/test-connection";

const { connectMock, callMock, disconnectMock, createJsonRpcClientMock } =
  vi.hoisted(() => {
    const connect = vi.fn();
    const call = vi.fn();
    const disconnect = vi.fn();

    return {
      connectMock: connect,
      callMock: call,
      disconnectMock: disconnect,
      createJsonRpcClientMock: vi.fn(() => ({
        connect,
        call,
        disconnect,
      })),
    };
  });

vi.mock("@/lib/jsonrpc-client", () => ({
  createJsonRpcClient: createJsonRpcClientMock,
}));

describe("testEndpointConnection", () => {
  beforeEach(() => {
    connectMock.mockReset();
    callMock.mockReset();
    disconnectMock.mockReset();
    createJsonRpcClientMock.mockClear();
  });

  it("returns true when connection and version call succeed", async () => {
    connectMock.mockResolvedValue(undefined);
    callMock.mockResolvedValue("2.0.0");

    await expect(
      testEndpointConnection("ws://localhost:4701/api/webrpc/v0"),
    ).resolves.toBe(true);

    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(callMock).toHaveBeenCalledWith("Version");
    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });

  it("returns false when connect fails", async () => {
    connectMock.mockRejectedValue(new Error("boom"));

    await expect(
      testEndpointConnection("ws://localhost:4701/api/webrpc/v0"),
    ).resolves.toBe(false);

    expect(callMock).not.toHaveBeenCalled();
    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });

  it("disconnects client even when version call fails", async () => {
    connectMock.mockResolvedValue(undefined);
    callMock.mockRejectedValue(new Error("rpc failed"));

    await expect(
      testEndpointConnection("ws://localhost:4701/api/webrpc/v0"),
    ).resolves.toBe(false);

    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });
});
