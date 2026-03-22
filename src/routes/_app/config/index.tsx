import { createFileRoute, Navigate } from "@tanstack/react-router";
import { DEFAULT_CONFIG_SEARCH } from "./-module/search-state";

export const Route = createFileRoute("/_app/config/")({
  component: () => (
    <Navigate to="/config/editor" search={DEFAULT_CONFIG_SEARCH} />
  ),
});
