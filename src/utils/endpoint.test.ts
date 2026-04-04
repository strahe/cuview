import { describe, expect, it } from "vitest";
import { isValidHost, normalizeEndpoint } from "@/utils/endpoint";

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

describe("isValidHost", () => {
  it("accepts simple hostname", () => {
    expect(isValidHost("localhost")).toBe(true);
    expect(isValidHost("my-host")).toBe(true);
    expect(isValidHost("curio.example.com")).toBe(true);
  });

  it("accepts hostname with port", () => {
    expect(isValidHost("localhost:4701")).toBe(true);
    expect(isValidHost("host:80")).toBe(true);
    expect(isValidHost("host:65535")).toBe(true);
  });

  it("accepts IPv4 addresses", () => {
    expect(isValidHost("192.168.1.1")).toBe(true);
    expect(isValidHost("192.168.1.1:8080")).toBe(true);
  });

  it("accepts IPv6 addresses", () => {
    expect(isValidHost("[::1]")).toBe(true);
    expect(isValidHost("[::1]:8080")).toBe(true);
    expect(isValidHost("[2001:db8::1]")).toBe(true);
  });

  it("accepts underscored hostnames (Docker/K8s)", () => {
    expect(isValidHost("curio_worker_1")).toBe(true);
    expect(isValidHost("curio_worker:4701")).toBe(true);
  });

  it("rejects port numbers above 65535", () => {
    expect(isValidHost("host:65536")).toBe(false);
    expect(isValidHost("host:99999")).toBe(false);
    expect(isValidHost("host:0")).toBe(false);
  });

  it("rejects empty and falsy values", () => {
    expect(isValidHost("")).toBe(false);
  });

  it("rejects malicious inputs", () => {
    expect(isValidHost("javascript:alert(1)")).toBe(false);
    expect(isValidHost("host/path")).toBe(false);
    expect(isValidHost("user@host")).toBe(false);
    expect(isValidHost("host?query=1")).toBe(false);
    expect(isValidHost("host name")).toBe(false);
    expect(isValidHost("data:text/html,<script>")).toBe(false);
  });
});
