import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { HeroCard } from "@/hooks/use-dashboard-summary";
import { cn } from "@/lib/utils";

const statusDotColors: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  accent: "bg-primary",
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
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} size="sm">
              <CardHeader>
                <Skeleton className="h-3 w-20" />
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            Cluster Overview
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <Card key={card.id} size="sm" className="min-w-0">
            <CardHeader>
              <CardTitle className="truncate text-muted-foreground">
                {card.label}
              </CardTitle>
              <CardAction>
                <span
                  className={cn(
                    "block size-2 rounded-full",
                    statusDotColors[card.status],
                  )}
                />
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="truncate text-xl font-semibold tabular-nums leading-tight">
                {card.value}
              </div>
              <CardDescription className="truncate">
                {card.subtitle}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
