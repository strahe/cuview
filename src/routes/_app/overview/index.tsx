import { createFileRoute } from "@tanstack/react-router";
import { Home } from "lucide-react";

export const Route = createFileRoute("/_app/overview/")({
  component: OverviewPage,
});

function OverviewPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Home className="size-6" />
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <p className="text-[hsl(var(--muted-foreground))]">
        Overview dashboard — components coming soon.
      </p>
    </div>
  );
}
