import {
  createFileRoute,
  Link,
  Outlet,
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
  { label: "Pieces", to: "/market/pieces" },
  { label: "MK12 Deals", to: "/market/mk12/deals" },
  { label: "MK20 Deals", to: "/market/mk20/deals" },
  { label: "Settings", to: "/market/settings" },
];

function MarketLayout() {
  usePageTitle("Market");
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Market</h1>
        <p className="text-sm text-muted-foreground">
          Deal management and market operations
        </p>
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
