import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/actor")({
  component: ActorLayout,
});

function ActorLayout() {
  return (
    <>
      <div className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="px-4 py-3 sm:px-5">
          <h1 className="text-xl font-semibold tracking-tight">Actors</h1>
        </div>
      </div>
      <div className="space-y-4 px-4 py-4 sm:px-5">
        <Outlet />
      </div>
    </>
  );
}
