import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageTitle } from "@/hooks/use-page-title";

export const Route = createFileRoute("/_app/proof-share")({
  component: ProofShareLayout,
});

const tabs = [
  { label: "Provider", to: "/proof-share/provider" },
  { label: "Client", to: "/proof-share/client" },
];

function ProofShareLayout() {
  usePageTitle("Snark Market");
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const activeTab =
    tabs.find((tab) => currentPath.startsWith(tab.to))?.to ?? tabs[0]?.to;

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
          <h1 className="text-xl font-semibold tracking-tight">Snark Market</h1>
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
