import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageTitle } from "@/hooks/use-page-title";

export const Route = createFileRoute("/_app/sectors")({
  component: SectorsLayout,
});

const tabs = [
  { label: "Overview", to: "/sectors" },
  { label: "CC Scheduler", to: "/sectors/cc-scheduler" },
  { label: "Expiration", to: "/sectors/expiration" },
  { label: "Diagnostics", to: "/sectors/diagnostics" },
];

function SectorsLayout() {
  usePageTitle("Sectors");
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sectors</h1>
        <p className="text-sm text-muted-foreground">
          Sector management, scheduling, and expiration
        </p>
      </div>

      <Tabs
        value={
          tabs.find((t) =>
            t.to === "/sectors"
              ? currentPath === "/sectors" || currentPath === "/sectors/"
              : currentPath.startsWith(t.to),
          )?.to ?? tabs[0]?.to
        }
      >
        <TabsList>
          {tabs.map((tab) => (
            <Link key={tab.to} to={tab.to}>
              <TabsTrigger value={tab.to}>{tab.label}</TabsTrigger>
            </Link>
          ))}
        </TabsList>
      </Tabs>

      <Outlet />
    </div>
  );
}
