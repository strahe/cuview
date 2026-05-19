import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskTypePanel } from "./task-type-panel";

const {
  runNowMock,
  useSingletonRunNowMock,
  useSingletonTaskInfoMock,
  useTaskDetailBundleMock,
} = vi.hoisted(() => ({
  runNowMock: vi.fn(),
  useSingletonRunNowMock: vi.fn(),
  useSingletonTaskInfoMock: vi.fn(),
  useTaskDetailBundleMock: vi.fn(),
}));

vi.mock("../-module/queries", () => ({
  useTaskDetailBundle: (params: unknown) => useTaskDetailBundleMock(params),
  useSingletonRunNow: () => useSingletonRunNowMock(),
  useSingletonTaskInfo: (taskType: string) =>
    useSingletonTaskInfoMock(taskType),
}));

vi.mock("@/components/composed/section-card", () => ({
  SectionCard: ({
    title,
    action,
    children,
  }: {
    title: string;
    action?: ReactNode;
    children: ReactNode;
  }) => (
    <section>
      <h2>{title}</h2>
      {action}
      {children}
    </section>
  ),
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

describe("TaskTypePanel", () => {
  beforeEach(() => {
    runNowMock.mockReset();
    useSingletonRunNowMock.mockReset();
    useSingletonTaskInfoMock.mockReset();
    useTaskDetailBundleMock.mockReset();

    useTaskDetailBundleMock.mockReturnValue({
      taskMachines: [],
      taskMachinesLoading: false,
      taskTypeHistory: [
        {
          id: 1,
          taskId: 55,
          name: "WindowPost",
          workStart: "2026-04-28T08:00:00Z",
          workEnd: "2026-04-28T08:00:01Z",
          posted: "2026-04-28T07:59:59Z",
          took: "1s",
          result: true,
          err: "",
          completedBy: "10.0.0.1:4701",
          completedById: 1,
          completedByName: "worker-01",
          eventCount: 0,
        },
      ],
      taskTypeHistoryLoading: false,
      taskTypeFailedHistory: [],
      taskTypeFailedHistoryLoading: false,
    });
    useSingletonTaskInfoMock.mockReturnValue({
      data: null,
      isLoading: false,
    });
    useSingletonRunNowMock.mockReturnValue({
      mutate: runNowMock,
      isPending: false,
    });
  });

  it("shows singleton info and requests run now when idle", () => {
    useSingletonTaskInfoMock.mockReturnValue({
      data: {
        taskName: "WindowPost",
        taskId: null,
        lastRunTime: "2026-04-28T08:00:00Z",
        runNowRequest: false,
      },
      isLoading: false,
    });

    render(<TaskTypePanel taskType="WindowPost" onOpenTask={vi.fn()} />);

    expect(screen.getByText("Singleton")).toBeInTheDocument();
    expect(screen.getByText("Idle")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Run Now" }));

    expect(runNowMock).toHaveBeenCalledWith(["WindowPost"]);
  });

  it("disables run now while the singleton task is running", () => {
    const onOpenTask = vi.fn();
    useSingletonTaskInfoMock.mockReturnValue({
      data: {
        taskName: "WindowPost",
        taskId: 77,
        lastRunTime: null,
        runNowRequest: false,
      },
      isLoading: false,
    });

    render(<TaskTypePanel taskType="WindowPost" onOpenTask={onOpenTask} />);

    expect(screen.getByRole("button", { name: "Run Now" })).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Open singleton task 77" }),
    );
    expect(onOpenTask).toHaveBeenCalledWith(77, "WindowPost");
  });

  it("disables run now when a singleton run request is pending", () => {
    useSingletonTaskInfoMock.mockReturnValue({
      data: {
        taskName: "WindowPost",
        taskId: null,
        lastRunTime: null,
        runNowRequest: true,
      },
      isLoading: false,
    });

    render(<TaskTypePanel taskType="WindowPost" onOpenTask={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Run Requested" }),
    ).toBeDisabled();
  });

  it("opens task detail from history task ids", () => {
    const onOpenTask = vi.fn();

    render(<TaskTypePanel taskType="WindowPost" onOpenTask={onOpenTask} />);

    fireEvent.click(screen.getByRole("button", { name: "Open task 55" }));

    expect(onOpenTask).toHaveBeenCalledWith(55, "WindowPost");
  });
});
