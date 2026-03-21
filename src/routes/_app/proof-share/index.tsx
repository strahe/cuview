import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/proof-share/")({
  component: () => <Navigate to="/proof-share/provider" />,
});
