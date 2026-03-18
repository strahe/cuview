import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/pdp/")({
  component: () => <Navigate to="/pdp/overview" />,
});
