import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageTitle } from "@/hooks/use-page-title";

export const Route = createFileRoute("/_app/pipeline")({
  component: PipelineLayout,
});

const tabs = [
  { label: "PoRep", to: "/pipeline/porep" },
  { label: "Snap", to: "/pipeline/snap" },
  { label: "Stats", to: "/pipeline/stats" },
];

function PipelineLayout() {
  usePageTitle("Pipeline");
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Sealing pipeline status</p>
      </div>

      <Tabs
        value={
          tabs.find((t) => currentPath.startsWith(t.to))?.to ?? tabs[0]?.to
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
