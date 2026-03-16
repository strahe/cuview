import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/wallets/")({
  component: () => <Navigate to="/wallets/list" />,
});
