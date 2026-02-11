import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { AppQuickSearch } from "@/components/composed/app-quick-search";
import { ErrorBoundary } from "@/components/error-boundary";
import { CurioApiProvider } from "@/contexts/curio-api-context";
import { LayoutProvider } from "@/contexts/layout-context";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <LayoutProvider>
      <CurioApiProvider>
        <ErrorBoundary>
          <AppQuickSearch />
          <Outlet />
        </ErrorBoundary>
      </CurioApiProvider>
    </LayoutProvider>
  );
}
