import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurioRpc } from "@/hooks/use-curio-query";
import type { PipelineWaterfallStats } from "@/types/pipeline";

export const Route = createFileRoute("/_app/pipeline/stats")({
  component: PipelineStatsPage,
});

function WaterfallChart({
  title,
  data,
  isLoading,
}: {
  title: string;
  data: PipelineWaterfallStats | undefined;
  isLoading: boolean;
}) {
  const chartData = useMemo(() => {
    if (!data) return [];
    const items: Array<{
      name: string;
      Pending: number;
      Running: number;
    }> = [{ name: "Total", Pending: data.Total, Running: 0 }];
    for (const stage of data.Stages) {
      items.push({
        name: stage.Name,
        Pending: stage.Pending,
        Running: stage.Running,
      });
    }
    return items;
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || (data.Total === 0 && data.Stages.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No pipeline activity
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={"var(--border)"} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--foreground)",
              }}
            />
            <Legend />
            <Bar dataKey="Pending" fill={"var(--destructive)"} />
            <Bar dataKey="Running" fill={"var(--chart-2)"} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function PipelineStatsPage() {
  const { data: sdrStats, isLoading: sdrLoading } =
    useCurioRpc<PipelineWaterfallStats>("PipelineStatsSDR", [], {
      refetchInterval: 30_000,
    });
  const { data: snapStats, isLoading: snapLoading } =
    useCurioRpc<PipelineWaterfallStats>("PipelineStatsSnap", [], {
      refetchInterval: 30_000,
    });
  const { data: marketStats, isLoading: marketLoading } =
    useCurioRpc<PipelineWaterfallStats>("PipelineStatsMarket", [], {
      refetchInterval: 30_000,
    });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Pipeline Stats</h2>
      <div className="grid gap-6 xl:grid-cols-2">
        <WaterfallChart
          title="SDR Pipeline"
          data={sdrStats}
          isLoading={sdrLoading}
        />
        <WaterfallChart
          title="Sector Update Pipeline"
          data={snapStats}
          isLoading={snapLoading}
        />
        <WaterfallChart
          title="Market Pipeline"
          data={marketStats}
          isLoading={marketLoading}
        />
      </div>
    </div>
  );
}
