import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SetupPage } from "@/routes/setup";

const navigateMock = vi.fn();
const testAndSwitchEndpointMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  useNavigate: () => navigateMock,
}));

vi.mock("@/contexts/curio-api-context", () => ({
  useCurioConnection: () => ({
    endpoint: "ws://localhost:4701/api/webrpc/v0",
    testAndSwitchEndpoint: testAndSwitchEndpointMock,
  }),
}));

describe("SetupPage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    testAndSwitchEndpointMock.mockReset();
  });

  it("navigates to overview only when connect succeeds", async () => {
    const user = userEvent.setup();
    testAndSwitchEndpointMock.mockResolvedValue({
      ok: true,
      endpoint: "ws://192.168.1.230:4701/api/webrpc/v0",
    });

    render(<SetupPage />);

    await user.clear(screen.getByLabelText("Curio Endpoint"));
    await user.type(
      screen.getByLabelText("Curio Endpoint"),
      "http://192.168.1.230:4701/",
    );

    await user.click(screen.getByRole("button", { name: "Connect" }));

    expect(testAndSwitchEndpointMock).toHaveBeenCalledWith(
      "http://192.168.1.230:4701/",
    );
    expect(navigateMock).toHaveBeenCalledWith({ to: "/overview" });
  });

  it("shows error and stays on setup when connect fails", async () => {
    const user = userEvent.setup();
    testAndSwitchEndpointMock.mockResolvedValue({
      ok: false,
      error: "Unable to connect to this endpoint.",
    });

    render(<SetupPage />);

    await user.click(screen.getByRole("button", { name: "Connect" }));

    await waitFor(() => {
      expect(
        screen.getByText("Unable to connect to this endpoint."),
      ).toBeInTheDocument();
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("resets test status when endpoint input changes", async () => {
    const user = userEvent.setup();
    testAndSwitchEndpointMock.mockResolvedValue({
      ok: true,
      endpoint: "ws://localhost:4701/api/webrpc/v0",
    });

    render(<SetupPage />);

    await user.click(screen.getByRole("button", { name: "Test Connection" }));
    await waitFor(() => {
      expect(screen.getByText("Connection successful!")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Curio Endpoint"), "x");

    expect(
      screen.queryByText("Connection successful!"),
    ).not.toBeInTheDocument();
  });

  it("disables buttons while testing", async () => {
    const user = userEvent.setup();
    let resolveSwitch:
      | ((value: { ok: true; endpoint: string }) => void)
      | undefined;
    testAndSwitchEndpointMock.mockReturnValue(
      new Promise<{ ok: true; endpoint: string }>((resolve) => {
        resolveSwitch = resolve;
      }),
    );

    render(<SetupPage />);

    await user.click(screen.getByRole("button", { name: "Test Connection" }));

    expect(screen.getByRole("button", { name: "Testing..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Connect" })).toBeDisabled();

    if (!resolveSwitch) {
      throw new Error("Expected switch resolver to be initialized");
    }

    resolveSwitch({
      ok: true,
      endpoint: "ws://localhost:4701/api/webrpc/v0",
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Test Connection" }),
      ).toBeEnabled();
    });
  });
});
