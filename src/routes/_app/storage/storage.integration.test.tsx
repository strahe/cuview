import { render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let currentPathname = "/storage/usage";
const navigateElementSpy = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  stripSearchParams: (defaults: unknown) => ({
    type: "stripSearchParams",
    defaults,
  }),
  createFileRoute: () => (options: Record<string, unknown>) => ({
    ...options,
    useSearch: () => ({}),
    useNavigate: () => vi.fn(),
    useParams: () => ({ storageId: "storage-001" }),
    fullPath: "/storage/mock",
  }),
  useMatchRoute: () => (_opts: unknown) => false,
  useRouterState: () => ({ location: { pathname: currentPathname } }),
  Link: ({
    children,
    to,
    search,
    ...props
  }: {
    children?: ReactNode;
    to: string;
    search?: unknown;
  }) => (
    <a
      href={to}
      data-testid={`link-${to}`}
      data-search={JSON.stringify(search ?? null)}
      {...props}
    >
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="storage-outlet">outlet</div>,
  Navigate: (props: unknown) => {
    navigateElementSpy(props);
    return null;
  },
}));

vi.mock("@/components/ui/tabs", async () => {
  const React = await import("react");

  return {
    Tabs: ({ value, children }: { value: string; children: ReactNode }) => (
      <div data-testid="tabs" data-value={value}>
        {children}
      </div>
    ),
    TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    TabsTrigger: ({
      children,
      render,
      value,
    }: {
      children: ReactNode;
      render?: ReactElement;
      value: string;
    }) => {
      if (render && React.isValidElement(render)) {
        return React.cloneElement(
          render as ReactElement<{
            children?: ReactNode;
            "data-testid"?: string;
          }>,
          {
            "data-testid": `tab-link-${value}`,
            children,
          },
        );
      }

      return <button data-testid={`tab-link-${value}`}>{children}</button>;
    },
  };
});

vi.mock("@/hooks/use-page-title", () => ({
  usePageTitle: vi.fn(),
}));

describe("storage routes", () => {
  beforeEach(() => {
    currentPathname = "/storage/usage";
    navigateElementSpy.mockReset();
  });

  it("redirects /storage to /storage/usage", async () => {
    const { Route } = await import("./index");
    const RedirectComponent = (
      Route as unknown as { component: () => ReactNode }
    ).component;

    render(<RedirectComponent />);

    expect(navigateElementSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: "/storage/usage" }),
    );
  });

  it("keeps the Paths tab active on detail routes and preserves explicit tab search defaults", async () => {
    currentPathname = "/storage/paths/storage-001";

    const { Route } = await import("./route");
    const LayoutComponent = (Route as unknown as { component: () => ReactNode })
      .component;

    render(<LayoutComponent />);

    expect(screen.getByTestId("tabs")).toHaveAttribute(
      "data-value",
      "/storage/paths",
    );
    expect(screen.getByTestId("tab-link-/storage/paths")).toHaveAttribute(
      "data-search",
      JSON.stringify({
        q: "",
        capability: "all",
        health: "all",
      }),
    );
    expect(screen.getByTestId("tab-link-/storage/gc")).toHaveAttribute(
      "data-search",
      JSON.stringify({
        miner: "",
        sectorNum: null,
        limit: 50,
        offset: 0,
      }),
    );
  });

  it("configures storage search middleware to strip default values from URLs", async () => {
    const [{ Route: PathsRoute }, { Route: GcRoute }, { Route: DetailRoute }] =
      await Promise.all([
        import("./paths/index"),
        import("./gc"),
        import("./paths/$storageId"),
      ]);

    expect((PathsRoute as { search?: unknown }).search).toEqual({
      middlewares: [
        {
          type: "stripSearchParams",
          defaults: {
            q: "",
            capability: "all",
            health: "all",
          },
        },
      ],
    });
    expect((GcRoute as { search?: unknown }).search).toEqual({
      middlewares: [
        {
          type: "stripSearchParams",
          defaults: {
            miner: "",
            sectorNum: null,
            limit: 50,
            offset: 0,
          },
        },
      ],
    });
    expect((DetailRoute as { search?: unknown }).search).toEqual({
      middlewares: [
        {
          type: "stripSearchParams",
          defaults: {
            q: "",
            capability: "all",
            health: "all",
            limit: 50,
            offset: 0,
          },
        },
      ],
    });
  });
});
