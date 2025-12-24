import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppLayout } from "@/layouts/app-layout";

export const Route = createFileRoute("/_app")({
  component: AppLayoutRoute,
});

function AppLayoutRoute() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
