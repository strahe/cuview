import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/tasks/")({
  component: () => <Navigate to="/tasks/active" />,
});
