import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { HeroCard } from "@/hooks/use-dashboard-summary";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  success: "border-l-success",
  warning: "border-l-warning",
  info: "border-l-info",
  accent: "border-l-primary",
};

interface DashboardHeroProps {
  cards: HeroCard[];
  loading: boolean;
  onRefresh: () => void;
}

export function DashboardHero({
  cards,
  loading,
  onRefresh,
}: DashboardHeroProps) {
  if (loading && cards.every((c) => c.value === "0" || c.value === "0/0")) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="px-4 py-3">
                <Skeleton className="mb-1.5 h-3 w-20" />
                <Skeleton className="mb-1 h-7 w-14" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Cluster Overview</h1>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <Card
            key={card.id}
            className={cn("border-l-4", statusColors[card.status])}
          >
            <CardContent className="px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-1 text-xl font-bold leading-tight">
                {card.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {card.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
