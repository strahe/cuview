import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/pipeline/")({
  component: () => <Navigate to="/pipeline/porep" />,
});
