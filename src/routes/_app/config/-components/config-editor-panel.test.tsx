import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ConfigEditMode, ConfigInfoDisplay } from "../-module/types";
import { ConfigEditorPanel } from "./config-editor-panel";

const { saveMutationState, saveMutateMock, visualSaveMock } = vi.hoisted(
  () => ({
    saveMutationState: {
      isPending: false,
    },
    saveMutateMock: vi.fn(),
    visualSaveMock: vi.fn(),
  }),
);

vi.mock("@/components/ui/alert", () => ({
  Alert: ({
    children,
    ...props
  }: ComponentProps<"div"> & { children: ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  AlertDescription: ({
    children,
    ...props
  }: ComponentProps<"div"> & { children: ReactNode }) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    type = "button",
    variant: _variant,
    size: _size,
    ...props
  }: ComponentProps<"button"> & { size?: string; variant?: string }) => (
    <button type={type} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({
    children,
    ...props
  }: ComponentProps<"div"> & { children: ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({
    children,
    ...props
  }: ComponentProps<"div"> & { children: ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({
    children,
    ...props
  }: ComponentProps<"div"> & { children: ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({
    children,
    ...props
  }: ComponentProps<"h2"> & { children: ReactNode }) => (
    <h2 {...props}>{children}</h2>
  ),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: (props: ComponentProps<"div">) => <div {...props} />,
}));

vi.mock("@/components/ui/tabs", () => {
  let currentValue = "";
  let handleValueChange: ((value: string) => void) | undefined;

  return {
    Tabs: ({
      children,
      onValueChange,
      value,
    }: {
      children: ReactNode;
      onValueChange?: (value: string) => void;
      value?: string;
    }) => {
      currentValue = value ?? "";
      handleValueChange = onValueChange;
      return <div>{children}</div>;
    },
    TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    TabsTrigger: ({
      children,
      value,
    }: {
      children: ReactNode;
      value: string;
    }) => (
      <button
        type="button"
        aria-pressed={currentValue === value}
        onClick={() => handleValueChange?.(value)}
      >
        {children}
      </button>
    ),
  };
});

vi.mock("@/components/ui/textarea", () => ({
  Textarea: (props: ComponentProps<"textarea">) => <textarea {...props} />,
}));

vi.mock("@/contexts/curio-api-context", () => ({
  useCurioApi: () => ({
    restGet: vi.fn(),
  }),
}));

vi.mock("../-module/queries", () => ({
  useConfigEditorBundle: () => ({
    isLoading: false,
    schema: { type: "object" },
  }),
  useSaveLayerMutation: () => ({
    get isPending() {
      return saveMutationState.isPending;
    },
    mutate: saveMutateMock,
  }),
}));

vi.mock("./config-visual-editor", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    ConfigVisualEditor: React.forwardRef(
      (
        _props: {
          infoDisplayMode: ConfigInfoDisplay;
          layerName: string;
        },
        ref: React.ForwardedRef<{ save: () => Promise<unknown> }>,
      ) => {
        React.useImperativeHandle(ref, () => ({
          save: visualSaveMock,
        }));

        return <div>Visual editor mock</div>;
      },
    ),
  };
});

vi.mock("./history-dialog", () => ({
  HistoryDialog: ({
    onRestore,
    open,
  }: {
    onRestore?: (content: string) => void;
    open: boolean;
  }) =>
    open ? (
      <button type="button" onClick={() => onRestore?.('{"restored":true}')}>
        Restore mock history
      </button>
    ) : null,
}));

function ConfigEditorPanelHarness({
  initialMode = "visual",
}: {
  initialMode?: ConfigEditMode;
}) {
  const [mode, setMode] = useState<ConfigEditMode>(initialMode);
  const [infoDisplay, setInfoDisplay] = useState<ConfigInfoDisplay>("icon");

  return (
    <ConfigEditorPanel
      layerName="layer-alpha"
      mode={mode}
      infoDisplay={infoDisplay}
      onModeChange={setMode}
      onInfoDisplayChange={setInfoDisplay}
    />
  );
}

describe("ConfigEditorPanel", () => {
  beforeEach(() => {
    saveMutationState.isPending = false;
    saveMutateMock.mockReset();
    visualSaveMock.mockReset();
  });

  it("routes visual saves through the shared save mutation", async () => {
    const user = userEvent.setup();
    const payload = { workers: ["alpha"] };
    visualSaveMock.mockResolvedValue(payload);

    render(<ConfigEditorPanelHarness initialMode="visual" />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(visualSaveMock).toHaveBeenCalledTimes(1);
    expect(saveMutateMock).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    );
  });

  it("blocks switching back to visual after restore until JSON save succeeds", async () => {
    const user = userEvent.setup();

    render(<ConfigEditorPanelHarness initialMode="visual" />);

    await user.click(screen.getByRole("button", { name: "History" }));
    await user.click(
      screen.getByRole("button", { name: "Restore mock history" }),
    );

    expect(screen.getByRole("textbox")).toHaveValue('{"restored":true}');

    await user.click(screen.getByRole("button", { name: "Visual" }));

    expect(screen.getByRole("textbox")).toHaveValue('{"restored":true}');
    expect(
      screen.getByText(/save the restored json before switching to visual/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save" }));

    const [, options] = saveMutateMock.mock.lastCall as [
      unknown,
      { onSuccess: () => void },
    ];

    options.onSuccess();

    await user.click(screen.getByRole("button", { name: "Visual" }));

    expect(screen.getByText("Visual editor mock")).toBeInTheDocument();
  });
});
