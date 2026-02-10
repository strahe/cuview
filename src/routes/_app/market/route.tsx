import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { usePageTitle } from "@/hooks/use-page-title";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouterState } from "@tanstack/react-router";

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
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Deal management and market operations
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
