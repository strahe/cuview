import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskSearchState } from "./-module/types";

let currentSearch: TaskSearchState = {
  q: "",
  showBg: false,
  coalesce: true,
  result: "all",
  taskType: "",
  taskId: null as number | null,
  limit: 100,
  offset: 0,
};

const navigateMock = vi.fn();

const useTaskSummaryMock = vi.fn();
const useTaskHistoryMock = vi.fn();
const useTaskStatsMock = vi.fn();
const useTaskDetailBundleMock = vi.fn();
const useRestartFailedTaskMock = vi.fn();
const overlayRenderSpy = vi.fn();
const navigateElementSpy = vi.fn();

function renderWithLayoutControls(ui: ReactNode) {
  return render(ui);
}

vi.mock("@tanstack/react-router", () => ({
  stripSearchParams: (defaults: unknown) => defaults,
  createFileRoute: () => (options: Record<string, unknown>) => ({
    ...options,
    useSearch: () => currentSearch,
    useNavigate: () => navigateMock,
    fullPath: "/tasks/mock",
  }),
  useMatchRoute: () => (_opts: unknown) => false,
  useRouterState: () => ({ location: { pathname: "/tasks/active" } }),
  Link: ({ children, search }: { children: ReactNode; search?: unknown }) => (
    <a href="#tab" data-testid="tab-link" data-search={String(search)}>
      {children}
    </a>
  ),
  Outlet: () => <div>outlet</div>,
  Navigate: (props: unknown) => {
    navigateElementSpy(props);
    return null;
  },
}));

vi.mock("@/components/table/data-table", () => ({
  DataTable: ({
    data,
    onRowClick,
  }: {
    data: unknown[];
    onRowClick?: (row: unknown) => void;
  }) => (
    <div>
      {data.map((row, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onRowClick?.(row)}
        >{`row-${index}`}</button>
      ))}
    </div>
  ),
}));

vi.mock("@/components/ui/select", async () => {
  const React = await import("react");
  const SelectContext = React.createContext<{
    value?: string;
    onValueChange?: (value: string) => void;
  } | null>(null);

  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value?: string;
      onValueChange?: (value: string) => void;
      children: ReactNode;
    }) => (
      <SelectContext.Provider value={{ value, onValueChange }}>
        <div>{children}</div>
      </SelectContext.Provider>
    ),
    SelectTrigger: ({
      children,
      ...props
    }: ComponentProps<"button"> & { children: ReactNode }) => (
      <button type="button" role="combobox" aria-expanded="false" {...props}>
        {children}
      </button>
    ),
    SelectValue: () => {
      const context = React.useContext(SelectContext);
      return <span>{context?.value ?? ""}</span>;
    },
    SelectContent: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    SelectItem: ({
      value,
      children,
    }: {
      value: string;
      children: ReactNode;
    }) => {
      const context = React.useContext(SelectContext);
      return (
        <button
          type="button"
          role="option"
          onClick={() => context?.onValueChange?.(value)}
        >
          {children}
        </button>
      );
    },
  };
});

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

vi.mock("@/routes/_app/tasks/-components/tasks-overlay-drawer", () => ({
  TasksOverlayDrawer: ({
    open,
    onOpenChange,
    children,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
  }) => {
    overlayRenderSpy(open);
    return (
      <div>
        <div data-testid="overlay-open">{String(open)}</div>
        {open ? (
          <button type="button" onClick={() => onOpenChange(false)}>
            close-overlay
          </button>
        ) : null}
        {children}
      </div>
    );
  },
}));

vi.mock("./-module/queries", () => ({
  useTaskSummary: () => useTaskSummaryMock(),
  useTaskHistory: (limit: number, offset: number) =>
    useTaskHistoryMock(limit, offset),
  useTaskStats: () => useTaskStatsMock(),
  useTaskDetailBundle: (params: { taskId: number | null; taskType: string }) =>
    useTaskDetailBundleMock(params),
  useRestartFailedTask: () => useRestartFailedTaskMock(),
}));

vi.mock("./-components/task-type-panel", () => ({
  TaskTypePanel: ({ taskType }: { taskType: string }) => (
    <div data-testid="task-type-panel">{taskType}</div>
  ),
}));

describe("tasks integration", () => {
  beforeEach(() => {
    currentSearch = {
      q: "",
      showBg: false,
      coalesce: true,
      result: "all",
      taskType: "",
      taskId: null,
      limit: 100,
      offset: 0,
    };

    navigateMock.mockReset();
    useTaskSummaryMock.mockReset();
    useTaskHistoryMock.mockReset();
    useTaskStatsMock.mockReset();
    useTaskDetailBundleMock.mockReset();
    useRestartFailedTaskMock.mockReset();
    overlayRenderSpy.mockReset();
    navigateElementSpy.mockReset();

    useTaskSummaryMock.mockReturnValue({
      data: [
        {
          id: 101,
          name: "SealSDR",
          spId: "123",
          miner: "f0123",
          sincePosted: "2026-03-02T08:00:00Z",
          sincePostedStr: "10s",
          owner: "10.0.0.1:4701",
          ownerId: 1,
          status: "running",
          isBackground: false,
        },
      ],
      isLoading: false,
    });

    useTaskHistoryMock.mockReturnValue({
      data: [
        {
          taskId: 201,
          name: "SealSDR",
          posted: "2026-03-02T08:00:00Z",
          start: "2026-03-02T08:00:01Z",
          queued: "1s",
          took: "4s",
          result: true,
          err: "",
          completedBy: "10.0.0.1:4701",
        },
      ],
      isLoading: false,
    });

    useTaskStatsMock.mockReturnValue({
      data: [],
      isLoading: false,
    });

    useTaskDetailBundleMock.mockReturnValue({
      taskStatus: null,
      taskStatusLoading: false,
      taskStatusError: null,
      taskDetail: null,
      taskDetailLoading: false,
      taskDetailError: null,
      taskHistoryById: [],
      taskHistoryByIdLoading: false,
      taskHistoryByIdError: null,
      taskMachines: [],
      taskMachinesLoading: false,
      taskMachinesError: null,
      taskTypeHistory: [],
      taskTypeHistoryLoading: false,
      taskTypeHistoryError: null,
      taskTypeFailedHistory: [],
      taskTypeFailedHistoryLoading: false,
      taskTypeFailedHistoryError: null,
    });

    useRestartFailedTaskMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it("opens task detail flow by writing taskId/taskType into route search on row click", async () => {
    const { ActiveTasksPage } = await import("./active");
    renderWithLayoutControls(<ActiveTasksPage />);
    expect(
      screen.queryByText("Execution queue for active tasks."),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "row-0" }));

    expect(navigateMock).toHaveBeenCalledTimes(1);
    const payload = navigateMock.mock.calls[0]?.[0] as {
      search: (prev: typeof currentSearch) => typeof currentSearch;
    };
    const next = payload.search(currentSearch);
    expect(next.taskId).toBe(101);
    expect(next.taskType).toBe("SealSDR");
  });

  it("clears task selection in search when detail drawer closes", async () => {
    currentSearch = {
      ...currentSearch,
      taskId: 101,
      taskType: "SealSDR",
    };

    const { ActiveTasksPage } = await import("./active");
    renderWithLayoutControls(<ActiveTasksPage />);

    fireEvent.click(screen.getByRole("button", { name: "close-overlay" }));

    expect(navigateMock).toHaveBeenCalledTimes(1);
    const payload = navigateMock.mock.calls[0]?.[0] as {
      search: (prev: typeof currentSearch) => typeof currentSearch;
    };
    const next = payload.search(currentSearch);
    expect(next.taskId).toBeNull();
    expect(next.taskType).toBe("");
  });

  it("preserves search when switching tabs", async () => {
    const { TasksLayout } = await import("./route");
    render(<TasksLayout />);
    expect(
      screen.queryByText("Monitor and manage Harmony tasks"),
    ).not.toBeInTheDocument();

    const links = screen.getAllByTestId("tab-link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("data-search")).toBe("true");
    }
  });

  it("redirects legacy overview route to analysis while preserving search state", async () => {
    currentSearch = {
      ...currentSearch,
      q: "seal",
      result: "failed",
      taskType: "SealSDR",
      taskId: 101,
      limit: 50,
      offset: 100,
    };

    const { Route } = await import("./overview");
    const OverviewRouteComponent = (
      Route as unknown as { component: () => ReactNode }
    ).component;
    render(<OverviewRouteComponent />);

    expect(navigateElementSpy).toHaveBeenCalledTimes(1);
    expect(navigateElementSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "/tasks/analysis",
        search: currentSearch,
        replace: true,
      }),
    );
  });

  it("applies analysis result filter and clears analysis drawer selection on close", async () => {
    currentSearch = {
      ...currentSearch,
      result: "failed",
      taskType: "SealSDR",
    };

    useTaskStatsMock.mockReturnValue({
      data: [
        {
          name: "SealSDR",
          trueCount: 1,
          falseCount: 2,
          totalCount: 3,
          successRate: 33.33,
          runningMachines: 1,
        },
        {
          name: "WinPost",
          trueCount: 4,
          falseCount: 0,
          totalCount: 4,
          successRate: 100,
          runningMachines: 2,
        },
      ],
      isLoading: false,
    });

    const { TaskAnalysisPage } = await import("./analysis");
    renderWithLayoutControls(<TaskAnalysisPage />);
    expect(
      screen.queryByText("24h success and failure distribution by task type."),
    ).not.toBeInTheDocument();

    expect(screen.getAllByRole("button", { name: /row-/ })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "close-overlay" }));

    expect(navigateMock).toHaveBeenCalledTimes(1);
    const payload = navigateMock.mock.calls[0]?.[0] as {
      search: (prev: typeof currentSearch) => typeof currentSearch;
    };
    const next = payload.search(currentSearch);
    expect(next.taskType).toBe("");
    expect(next.taskId).toBeNull();
  });

  it("restarts failed task from detail panel", async () => {
    const mutate = vi.fn();
    useTaskDetailBundleMock.mockReturnValue({
      taskStatus: {
        taskId: 101,
        status: "failed",
        ownerId: 1,
        name: "SealSDR",
        postedAt: "2026-03-02T08:00:00Z",
      },
      taskStatusLoading: false,
      taskStatusError: null,
      taskDetail: {
        id: 101,
        name: "SealSDR",
        updateTime: "2026-03-02T08:00:20Z",
        postedTime: "2026-03-02T08:00:00Z",
        ownerId: 1,
        ownerAddr: "10.0.0.1:4701",
        ownerName: "worker-01",
      },
      taskDetailLoading: false,
      taskDetailError: null,
      taskHistoryById: [],
      taskHistoryByIdLoading: false,
      taskHistoryByIdError: null,
      taskMachines: [],
      taskMachinesLoading: false,
      taskMachinesError: null,
      taskTypeHistory: [],
      taskTypeHistoryLoading: false,
      taskTypeHistoryError: null,
      taskTypeFailedHistory: [],
      taskTypeFailedHistoryLoading: false,
      taskTypeFailedHistoryError: null,
    });
    useRestartFailedTaskMock.mockReturnValue({
      mutate,
      isPending: false,
    });

    const { TaskDetailPanel } = await import("./-components/task-detail-panel");
    render(<TaskDetailPanel taskId={101} taskType="SealSDR" />);

    expect(useTaskDetailBundleMock).toHaveBeenCalledWith({
      taskId: 101,
      taskType: "SealSDR",
      includeTaskTypeData: false,
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Restart Failed Task" }),
    );
    expect(mutate).toHaveBeenCalledWith([101]);
  });

  it("resets active filters from the unified toolbar", async () => {
    currentSearch = {
      ...currentSearch,
      q: "seal",
      showBg: true,
      coalesce: false,
      taskType: "SealSDR",
      taskId: 101,
    };

    const { ActiveTasksPage } = await import("./active");
    renderWithLayoutControls(<ActiveTasksPage />);

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(navigateMock).toHaveBeenCalledTimes(1);
    const payload = navigateMock.mock.calls[0]?.[0] as {
      search: (prev: typeof currentSearch) => typeof currentSearch;
    };
    const next = payload.search(currentSearch);
    expect(next.q).toBe("");
    expect(next.showBg).toBe(false);
    expect(next.coalesce).toBe(true);
    expect(next.taskType).toBe("");
    expect(next.taskId).toBeNull();
  });

  it("toggles show background tasks via toolbar checkbox", async () => {
    currentSearch = {
      ...currentSearch,
      showBg: false,
    };

    const { ActiveTasksPage } = await import("./active");
    renderWithLayoutControls(<ActiveTasksPage />);

    fireEvent.click(screen.getByLabelText("Show background tasks"));

    expect(navigateMock).toHaveBeenCalledTimes(1);
    const payload = navigateMock.mock.calls[0]?.[0] as {
      search: (prev: typeof currentSearch) => typeof currentSearch;
    };
    const next = payload.search(currentSearch);
    expect(next.showBg).toBe(true);
  });

  it("updates history result filter via toolbar select", async () => {
    currentSearch = {
      ...currentSearch,
      result: "all",
    };

    const { TaskHistoryPage } = await import("./history");
    renderWithLayoutControls(<TaskHistoryPage />);
    expect(
      screen.queryByText("Completed and failed task records."),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("combobox", { name: "Result" }));
    fireEvent.click(screen.getByRole("option", { name: "Failed" }));

    expect(navigateMock).toHaveBeenCalledTimes(1);
    const payload = navigateMock.mock.calls[0]?.[0] as {
      search: (prev: typeof currentSearch) => typeof currentSearch;
    };
    const next = payload.search(currentSearch);
    expect(next.result).toBe("failed");
  });

  it("shows history page range in the unified toolbar", async () => {
    currentSearch = {
      ...currentSearch,
      limit: 50,
      offset: 100,
    };

    useTaskHistoryMock.mockReturnValue({
      data: [
        {
          taskId: 301,
          name: "WinPost",
          posted: "2026-03-02T09:00:00Z",
          start: "2026-03-02T09:00:01Z",
          queued: "1s",
          took: "5s",
          result: true,
          err: "",
          completedBy: "10.0.0.2:4701",
        },
        {
          taskId: 302,
          name: "WinPost",
          posted: "2026-03-02T09:00:10Z",
          start: "2026-03-02T09:00:11Z",
          queued: "1s",
          took: "5s",
          result: true,
          err: "",
          completedBy: "10.0.0.2:4701",
        },
      ],
      isLoading: false,
    });

    const { TaskHistoryPage } = await import("./history");
    renderWithLayoutControls(<TaskHistoryPage />);

    expect(screen.getByText("Rows 101-102")).toBeInTheDocument();
  });
});
