import {
  createRootRouteWithContext,
  Outlet,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { CurioApiProvider } from "@/contexts/curio-api-context";
import { LayoutProvider } from "@/contexts/layout-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { AppQuickSearch } from "@/components/composed/app-quick-search";

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
