import {
  createFileRoute,
  Link,
  Outlet,
  useMatchRoute,
  useRouterState,
} from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageTitle } from "@/hooks/use-page-title";

export const Route = createFileRoute("/_app/market")({
  component: MarketLayout,
});

const tabs = [
  { label: "Balance", to: "/market/balance" },
  { label: "Asks", to: "/market/asks" },
  { label: "Pending", to: "/market/pending" },
  { label: "MK12 Deals", to: "/market/mk12/deals" },
  { label: "MK20 Deals", to: "/market/mk20/deals" },
  { label: "Pieces", to: "/market/pieces" },
  { label: "Settings", to: "/market/settings" },
];

function MarketLayout() {
  usePageTitle("Storage Market");
  const matchRoute = useMatchRoute();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const activeTab =
    tabs.find((tab) => matchRoute({ to: tab.to, fuzzy: true }))?.to ??
    tabs.find((tab) => currentPath.startsWith(tab.to.replace(/\/deals$/, "")))
      ?.to ??
    tabs[0]?.to;

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
          <h1 className="text-xl font-semibold tracking-tight">
            Storage Market
          </h1>
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
