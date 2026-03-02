import { describe, expect, it } from "vitest";
import { normalizeEndpoint } from "@/utils/endpoint";

describe("normalizeEndpoint", () => {
  it("normalizes http origin with trailing slash", () => {
    expect(normalizeEndpoint("http://host:4701/")).toBe(
      "ws://host:4701/api/webrpc/v0",
    );
  });

  it("normalizes http origin without trailing slash", () => {
    expect(normalizeEndpoint("http://host:4701")).toBe(
      "ws://host:4701/api/webrpc/v0",
    );
  });

  it("keeps explicit webrpc path", () => {
    expect(normalizeEndpoint("http://host:4701/api/webrpc/v0")).toBe(
      "ws://host:4701/api/webrpc/v0",
    );
  });

  it("adds default rpc path for websocket root path", () => {
    expect(normalizeEndpoint("ws://host:4701/")).toBe(
      "ws://host:4701/api/webrpc/v0",
    );
  });

  it("keeps existing websocket rpc endpoint", () => {
    expect(normalizeEndpoint("ws://host:4701/api/webrpc/v0")).toBe(
      "ws://host:4701/api/webrpc/v0",
    );
  });

  it("returns original value for invalid input", () => {
    expect(normalizeEndpoint("not a url")).toBe("not a url");
  });
});
