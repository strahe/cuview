import { createFileRoute, Navigate } from "@tanstack/react-router";
import { normalizeTaskSearch } from "./-module/search-state";

export const Route = createFileRoute("/_app/tasks/overview")({
  validateSearch: (search) => normalizeTaskSearch(search),
  component: LegacyOverviewRedirect,
});

function LegacyOverviewRedirect() {
  const search = Route.useSearch();
  return <Navigate to="/tasks/analysis" search={search} replace />;
}
