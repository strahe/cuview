import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Cuview</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-2">
          Curio Dashboard — coming soon
        </p>
      </div>
    </div>
  );
}
