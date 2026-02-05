import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/market/mk20/deals")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/market/mk20/deals"!</div>
}
