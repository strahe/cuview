import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/market")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/market"!</div>
}
