import { createFileRoute, Navigate } from "@tanstack/react-router";
import { isEndpointConfigured } from "@/contexts/curio-api-context";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  if (!isEndpointConfigured()) {
    return <Navigate to="/setup" />;
  }
  return <Navigate to="/overview" />;
}
