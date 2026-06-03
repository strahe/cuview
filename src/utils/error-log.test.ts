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
    expect(getErrorMessage({ message: "object failure" })).toBe(
      "object failure",
    );
    expect(getErrorMessage(null, "Fallback message")).toBe("Fallback message");
    expect(getErrorMessage(undefined, "Fallback message")).toBe(
      "Fallback message",
    );
  });

  it("masks sensitive values in readable error messages", () => {
    expect(
      getErrorMessage(
        new Error("failed to connect ws://user:secret@node.local/rpc"),
      ),
    ).toBe("failed to connect ws://***:***@node.local/rpc");

    expect(
      getErrorMessage(
        "request failed for https://node.local/rpc?token=secret&debug=1",
      ),
    ).toBe("request failed for https://node.local/rpc?token=***&debug=1");

    expect(
      getErrorMessage(
        new Error("failed to connect tcp://user:secret@node.local:4701/rpc"),
      ),
    ).toBe("failed to connect tcp://***:***@node.local:4701/rpc");

    expect(getErrorMessage("mongodb://admin:pass123@db.example.com")).toBe(
      "mongodb://***:***@db.example.com",
    );

    expect(
      getErrorMessage("redis://some-user:very_secret_pass@127.0.0.1:6379"),
    ).toBe("redis://***:***@127.0.0.1:6379");

    expect(
      getErrorMessage(
        "failed: tcp://user1:pass1@host1:4701,tcp://user2:pass2@host2:4702",
      ),
    ).toBe("failed: tcp://***:***@host1:4701,tcp://***:***@host2:4702");

    expect(
      getErrorMessage('["tcp://alpha:one@host1","redis://beta:two@host2"]'),
    ).toBe('["tcp://***:***@host1","redis://***:***@host2"]');

    expect(
      getErrorMessage({
        message:
          "rpc rejected eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.VeryLongSignature",
      }),
    ).toBe("rpc rejected ***JWT***");
  });

  it("does not mask non-token three-part identifiers as JWTs", () => {
    expect(
      getErrorMessage(
        "failed in servicecomponent.pipelineidentifier.stepidentifier",
      ),
    ).toBe("failed in servicecomponent.pipelineidentifier.stepidentifier");
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
