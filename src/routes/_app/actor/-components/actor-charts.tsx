import { BarChart3 } from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SectorBuckets } from "@/types/actor";
import {
  buildExpirationChartData,
  buildQAPChartData,
  buildVestedFundsChartData,
} from "../-module/adapters";

const chartTooltipStyle = {
  backgroundColor: "var(--background)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
};

export function ActorCharts({ buckets }: { buckets: SectorBuckets }) {
  const expirationData = useMemo(
    () => buildExpirationChartData(buckets),
    [buckets],
  );
  const qapData = useMemo(() => buildQAPChartData(buckets), [buckets]);
  const vestedData = useMemo(
    () => buildVestedFundsChartData(buckets),
    [buckets],
  );

  const hasData =
    expirationData.length > 0 || qapData.length > 0 || vestedData.length > 0;

  if (!hasData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-4" />
          Sector Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="expiration">
          <TabsList variant="line">
            <TabsTrigger value="expiration">Sector Count</TabsTrigger>
            <TabsTrigger value="qap">Quality Power</TabsTrigger>
            <TabsTrigger value="vested">Vested Funds</TabsTrigger>
          </TabsList>

          <TabsContent value="expiration" className="pt-4">
            {expirationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expirationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip contentStyle={chartTooltipStyle} />
                  <Legend />
                  <Bar dataKey="all" name="All Sectors" fill="var(--primary)" />
                  <Bar
                    dataKey="cc"
                    name="CC Sectors"
                    fill="var(--muted-foreground)"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </TabsContent>

          <TabsContent value="qap" className="pt-4">
            {qapData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={qapData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${v} TiB`}
                  />
                  <RechartsTooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value) => [`${value} TiB`, ""]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="all"
                    name="All QAP"
                    stroke="var(--primary)"
                    fill="var(--primary)"
                    fillOpacity={0.2}
                  />
                  <Area
                    type="monotone"
                    dataKey="cc"
                    name="CC QAP"
                    stroke="var(--muted-foreground)"
                    fill="var(--muted-foreground)"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </TabsContent>

          <TabsContent value="vested" className="pt-4">
            {vestedData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={vestedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${v} FIL`}
                  />
                  <RechartsTooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value) => [
                      `${Number(value).toFixed(4)} FIL`,
                      "",
                    ]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Vested Funds"
                    stroke="var(--chart-3)"
                    fill="var(--chart-3)"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
      No chart data available
    </div>
  );
}
