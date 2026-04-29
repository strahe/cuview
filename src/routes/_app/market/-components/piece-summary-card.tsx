import { Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PieceSummary } from "@/types/market";

interface PieceSummaryCardProps {
  data: PieceSummary | undefined;
  isLoading: boolean;
}

export function PieceSummaryCard({ data, isLoading }: PieceSummaryCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Database className="size-4" /> Piece Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-14" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="size-4" /> Piece Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{data.total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Indexed</p>
            <p className="text-lg font-bold">{data.indexed.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Announced</p>
            <p className="text-lg font-bold">
              {data.announced.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Updated</p>
            <p className="text-sm">{data.last_updated || "—"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
