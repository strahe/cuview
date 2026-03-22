import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopologyTable } from "./-components/topology-table";
import { useConfigTopology } from "./-module/queries";

export const Route = createFileRoute("/_app/config/topology")({
  component: TopologyPage,
});

function TopologyPage() {
  const { data: topology = [], isLoading } = useConfigTopology();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cluster Topology</CardTitle>
      </CardHeader>
      <CardContent>
        <TopologyTable data={topology} loading={isLoading} />
      </CardContent>
    </Card>
  );
}
