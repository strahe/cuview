import {
  createFileRoute,
  Link,
  Outlet,
  useMatchRoute,
  useRouterState,
} from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageTitle } from "@/hooks/use-page-title";
import { TasksLayoutControlsProvider } from "@/routes/_app/tasks/-components/tasks-layout-controls";

export const Route = createFileRoute("/_app/tasks")({
  component: TasksLayout,
});

const tabs = [
  { label: "Active", to: "/tasks/active" },
  { label: "History", to: "/tasks/history" },
  { label: "Analysis", to: "/tasks/analysis" },
];

export function TasksLayout() {
  usePageTitle("Tasks");
  const matchRoute = useMatchRoute();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <TasksLayoutControlsProvider
      render={(controls) => (
        <div className="sticky top-0 z-20 space-y-4 border-b border-border/50 bg-background/95 p-6 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
            <p className="text-sm text-muted-foreground">
              Monitor and manage Harmony tasks
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-3">
            <Tabs
              value={
                tabs.find((tab) => matchRoute({ to: tab.to, fuzzy: true }))
                  ?.to ??
                tabs.find((tab) => currentPath.startsWith(tab.to))?.to ??
                tabs[0]?.to
              }
            >
              <TabsList>
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.to}
                    value={tab.to}
                    render={<Link to={tab.to} search={true} />}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {controls ? <div className="min-w-0">{controls}</div> : null}
          </div>
        </div>
      )}
    >
      <div className="space-y-6 p-6 pt-6">
        <Outlet />
      </div>
    </TasksLayoutControlsProvider>
  );
}
