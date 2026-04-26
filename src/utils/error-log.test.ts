import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getClientErrorLogArgs,
  getErrorMessage,
  logClientError,
} from "./error-log";

describe("error log helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("normalizes unknown errors into a readable fallback", () => {
    expect(getErrorMessage(new Error("rpc failed"))).toBe("rpc failed");
    expect(getErrorMessage("plain failure")).toBe("plain failure");
    expect(getErrorMessage(42)).toBe("42");
    expect(getErrorMessage({ code: "E_RPC" })).toBe("Unexpected error");
    expect(getErrorMessage(null, "Fallback message")).toBe("Fallback message");
    expect(getErrorMessage(undefined, "Fallback message")).toBe(
      "Fallback message",
    );
  });

  it("keeps raw error details in development logs", () => {
    vi.stubEnv("DEV", true);
    const error = new Error("secret rpc token");
    const details = "component stack with /internal/path";

    expect(getClientErrorLogArgs(error, details)).toEqual([error, details]);
  });

  it("removes raw messages and details from production logs", () => {
    vi.stubEnv("DEV", false);
    const error = new Error("secret rpc token");
    error.stack = "stack with /internal/path";

    const args = getClientErrorLogArgs(error, "component stack secret");
    const output = args.map(String).join(" ");

    expect(output).toBe("Unexpected error");
    expect(output).not.toContain("secret rpc token");
    expect(output).not.toContain("/internal/path");
    expect(output).not.toContain("component stack secret");
  });

  it("logs through one console.error call", () => {
    vi.stubEnv("DEV", false);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    logClientError("Connection test failed:", new Error("secret host"));

    expect(spy).toHaveBeenCalledWith(
      "Connection test failed:",
      "Unexpected error",
    );
  });
});
