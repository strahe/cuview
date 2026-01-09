import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/market/")({
  component: () => <Navigate to="/market/balance" />,
});
