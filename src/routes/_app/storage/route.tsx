import {
  createFileRoute,
  Link,
  Outlet,
  useMatchRoute,
  useRouterState,
} from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  DEFAULT_STORAGE_GC_SEARCH,
  DEFAULT_STORAGE_PATHS_SEARCH,
} from "./-module/search-state";

export const Route = createFileRoute("/_app/storage")({
  component: StorageLayout,
});

const tabs = [
  { label: "Usage", to: "/storage/usage" },
  { label: "Paths", to: "/storage/paths" },
  { label: "GC", to: "/storage/gc" },
] as const;

function renderStorageTabLink(to: (typeof tabs)[number]["to"]) {
  if (to === "/storage/paths") {
    return <Link to={to} search={DEFAULT_STORAGE_PATHS_SEARCH} />;
  }

  if (to === "/storage/gc") {
    return <Link to={to} search={DEFAULT_STORAGE_GC_SEARCH} />;
  }

  return <Link to={to} />;
}

function StorageLayout() {
  usePageTitle("Storage");
  const matchRoute = useMatchRoute();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const activeTab =
    tabs.find(
      (tab) =>
        !!matchRoute({ to: tab.to, fuzzy: true }) ||
        currentPath.startsWith(tab.to),
    )?.to ?? tabs[0].to;

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
          <h1 className="text-xl font-semibold tracking-tight">Storage</h1>
          <Tabs value={activeTab}>
            <TabsList className="h-8">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.to}
                  value={tab.to}
                  nativeButton={false}
                  render={renderStorageTabLink(tab.to)}
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
