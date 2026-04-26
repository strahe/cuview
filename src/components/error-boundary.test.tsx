import { render, screen } from "@testing-library/react";
import type { ErrorInfo } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./error-boundary";

function ThrowingChild(): never {
  throw new Error("secret database path /var/lib/curio");
}

describe("ErrorBoundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("does not render raw error messages in production", () => {
    vi.stubEnv("DEV", false);
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByText(/secret database path/i)).not.toBeInTheDocument();
  });

  it("keeps raw error messages visible in development", () => {
    vi.stubEnv("DEV", true);
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/secret database path/i)).toBeInTheDocument();
  });

  it("sanitizes production console output", () => {
    vi.stubEnv("DEV", false);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const boundary = new ErrorBoundary({ children: null });
    const error = new Error("secret rpc url");
    error.stack = "stack contains /private/source.tsx";

    boundary.componentDidCatch(error, {
      componentStack: "component stack secret",
    } as ErrorInfo);

    const output = spy.mock.calls.flat().map(String).join(" ");
    expect(output).toContain("ErrorBoundary caught:");
    expect(output).toContain("Unexpected error");
    expect(output).not.toContain("secret rpc url");
    expect(output).not.toContain("/private/source.tsx");
    expect(output).not.toContain("component stack secret");
  });
});
