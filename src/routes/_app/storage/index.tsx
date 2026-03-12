import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/storage/")({
  component: StorageIndexRedirect,
});

function StorageIndexRedirect() {
  return <Navigate to="/storage/usage" />;
}
