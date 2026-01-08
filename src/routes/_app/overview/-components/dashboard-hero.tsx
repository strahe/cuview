import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { HeroCard } from "@/hooks/use-dashboard-summary";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusColors: Record<string, string> = {
  success: "border-l-[hsl(var(--success))]",
  warning: "border-l-[hsl(var(--warning))]",
  info: "border-l-[hsl(var(--info))]",
  accent: "border-l-[hsl(var(--primary))]",
};

interface DashboardHeroProps {
  cards: HeroCard[];
  loading: boolean;
  onRefresh: () => void;
}

export function DashboardHero({ cards, loading, onRefresh }: DashboardHeroProps) {
  if (loading && cards.every((c) => c.value === "0" || c.value === "0/0")) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="mb-1 h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Curio cluster overview
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card
            key={card.id}
            className={cn("border-l-4", statusColors[card.status])}
          >
            <CardContent className="p-6">
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-bold">{card.value}</p>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                {card.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
