import { createFileRoute, Navigate } from "@tanstack/react-router";
import { DEFAULT_TASK_SEARCH } from "./-module/search-state";

export const Route = createFileRoute("/_app/tasks/")({
  component: () => <Navigate to="/tasks/active" search={DEFAULT_TASK_SEARCH} />,
});
