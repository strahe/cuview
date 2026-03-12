import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/storage/paths")({
  component: StoragePathsLayout,
});

function StoragePathsLayout() {
  return <Outlet />;
}
