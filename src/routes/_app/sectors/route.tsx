import {
  createFileRoute,
  Link,
  Outlet,
  useMatchRoute,
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
  const matchRoute = useMatchRoute();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const activeTab =
    tabs.find((tab) => {
      if (tab.to === "/sectors") {
        return currentPath === "/sectors" || currentPath === "/sectors/";
      }

      return (
        !!matchRoute({ to: tab.to, fuzzy: true }) ||
        currentPath.startsWith(tab.to)
      );
    })?.to ?? tabs[0]?.to;

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
          <h1 className="text-xl font-semibold tracking-tight">Sectors</h1>
          <Tabs value={activeTab}>
            <TabsList className="h-8">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.to}
                  value={tab.to}
                  nativeButton={false}
                  render={<Link to={tab.to} search={true} />}
                  className="h-7 px-2.5 text-xs"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="space-y-4 px-4 py-4 sm:px-5">
        <Outlet />
      </div>
    </>
  );
}
