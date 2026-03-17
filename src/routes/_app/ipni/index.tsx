import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/ipni/")({
  component: () => <Navigate to="/ipni/providers" />,
});
