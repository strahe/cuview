import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageTitle } from "@/hooks/use-page-title";

export const Route = createFileRoute("/_app/pipeline")({
  component: PipelineLayout,
});

const tabs = [
  { label: "PoRep", to: "/pipeline/porep" },
  { label: "Snap", to: "/pipeline/snap" },
];

function PipelineLayout() {
  usePageTitle("Pipeline");
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Sealing pipeline status
        </p>
      </div>

      <TabsList>
        {tabs.map((tab) => (
          <Link key={tab.to} to={tab.to}>
            <TabsTrigger active={currentPath.startsWith(tab.to)}>
              {tab.label}
            </TabsTrigger>
          </Link>
        ))}
      </TabsList>

      <Outlet />
    </div>
  );
}
