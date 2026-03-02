import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsDialog } from "@/components/settings-dialog";

let currentEndpoint = "ws://localhost:4701/api/webrpc/v0";
let endpointHistory = [
  "ws://192.168.1.230:4701/api/webrpc/v0",
  "ws://192.168.1.231:4701/api/webrpc/v0",
];
let shouldFailSwitch = false;

const testAndSwitchEndpointMock = vi.fn(async (input: string) => {
  if (shouldFailSwitch) {
    return {
      ok: false as const,
      error: "Unable to connect to this endpoint.",
    };
  }

  const normalized =
    input === "http://192.168.1.240:4701/"
      ? "ws://192.168.1.240:4701/api/webrpc/v0"
      : input;

  currentEndpoint = normalized;
  endpointHistory = [
    normalized,
    ...endpointHistory.filter((item) => item !== normalized),
  ].slice(0, 5);

  return {
    ok: true as const,
    endpoint: normalized,
  };
});

vi.mock("@/contexts/curio-api-context", () => ({
  useCurioConnection: () => ({
    endpoint: currentEndpoint,
    endpointHistory,
    testAndSwitchEndpoint: testAndSwitchEndpointMock,
  }),
}));

vi.mock("@/contexts/layout-context", () => ({
  useLayout: () => ({
    isDark: false,
    setTheme: vi.fn(),
  }),
}));

describe("SettingsDialog RPC section", () => {
  beforeEach(() => {
    currentEndpoint = "ws://localhost:4701/api/webrpc/v0";
    endpointHistory = [
      "ws://192.168.1.230:4701/api/webrpc/v0",
      "ws://192.168.1.231:4701/api/webrpc/v0",
    ];
    shouldFailSwitch = false;
    testAndSwitchEndpointMock.mockClear();
  });

  it("switches endpoint successfully from manual input", async () => {
    const user = userEvent.setup();

    render(<SettingsDialog open onOpenChange={vi.fn()} />);

    await user.clear(screen.getByLabelText("RPC Endpoint"));
    await user.type(
      screen.getByLabelText("RPC Endpoint"),
      "http://192.168.1.240:4701/",
    );
    await user.click(screen.getByRole("button", { name: "Test & Switch" }));

    await waitFor(() => {
      expect(screen.getByText("Switched successfully.")).toBeInTheDocument();
    });
    expect(testAndSwitchEndpointMock).toHaveBeenCalledWith(
      "http://192.168.1.240:4701/",
    );
    expect(screen.getByText("http://192.168.1.240:4701")).toBeInTheDocument();
  });

  it("shows error and keeps endpoint when switch fails", async () => {
    const user = userEvent.setup();
    shouldFailSwitch = true;

    render(<SettingsDialog open onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Test & Switch" }));

    await waitFor(() => {
      expect(
        screen.getByText("Unable to connect to this endpoint."),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("Current endpoint: http://localhost:4701"),
    ).toBeInTheDocument();
  });

  it("supports quick switch from history", async () => {
    const user = userEvent.setup();

    render(<SettingsDialog open onOpenChange={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "http://192.168.1.230:4701" }),
    );

    expect(testAndSwitchEndpointMock).toHaveBeenCalledWith(
      "ws://192.168.1.230:4701/api/webrpc/v0",
    );
  });

  it("does not render duplicate history entries after repeated switch", async () => {
    const user = userEvent.setup();

    render(<SettingsDialog open onOpenChange={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "http://192.168.1.230:4701" }),
    );
    await waitFor(() => {
      expect(screen.getByText("Switched successfully.")).toBeInTheDocument();
    });

    const historyButtons = screen.getAllByRole("button", {
      name: "http://192.168.1.230:4701",
    });
    expect(historyButtons).toHaveLength(1);
  });
});
