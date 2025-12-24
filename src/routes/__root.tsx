import {
  createRootRouteWithContext,
  Outlet,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
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
        <Outlet />
      </CurioApiProvider>
    </LayoutProvider>
  );
}
