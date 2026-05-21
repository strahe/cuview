import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createRestClient,
  RestClientError,
  RestClientNetworkError,
} from "./rest-client";

describe("createRestClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("wraps fetch rejections as REST network errors", async () => {
    const cause = new TypeError("Failed to fetch");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(cause));

    const client = createRestClient({ baseURL: "http://curio.local" });

    await expect(client.get("/api/config/layers")).rejects.toMatchObject({
      cause,
      name: "RestClientNetworkError",
      url: "http://curio.local/api/config/layers",
    });
    await expect(client.get("/api/config/layers")).rejects.toBeInstanceOf(
      RestClientNetworkError,
    );
  });

  it("rethrows cancelled fetch requests", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    const client = createRestClient({ baseURL: "http://curio.local" });

    await expect(client.get("/api/config/layers")).rejects.toBe(abortError);

    const abortReason = new Error("Cancelled");
    const controller = new AbortController();
    controller.abort(abortReason);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortReason));

    await expect(
      client.get("/api/config/layers", { signal: controller.signal }),
    ).rejects.toBe(abortReason);

    const timeoutError = new DOMException("Timed out", "TimeoutError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError));

    await expect(client.get("/api/config/layers")).rejects.toBe(timeoutError);
  });

  it("keeps HTTP failures as REST response errors with backend messages", async () => {
    const client = createRestClient({ baseURL: "http://curio.local" });
    const cases = [
      {
        body: JSON.stringify({ message: "denied" }),
        message: "denied",
        response: { message: "denied" },
      },
      {
        body: "Layer already exists",
        message: "Layer already exists",
        response: "Layer already exists",
      },
    ];

    for (const testCase of cases) {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(testCase.body, {
            status: 403,
            statusText: "Forbidden",
          }),
        ),
      );

      const request = client.get("/api/config/layers");

      await expect(request).rejects.toMatchObject({
        message: testCase.message,
        name: "RestClientError",
        response: testCase.response,
        status: 403,
        statusText: "Forbidden",
      });
      await expect(request).rejects.toBeInstanceOf(RestClientError);
    }
  });
});
