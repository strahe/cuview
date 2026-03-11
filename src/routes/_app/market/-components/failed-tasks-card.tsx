import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FailedTasksCardProps {
  title?: string;
  categories: readonly (readonly [string, number])[];
  onRestart: () => void;
  onRemove: () => void;
  restartPending: boolean;
  removePending: boolean;
}

export function FailedTasksCard({
  title = "Failed Tasks",
  categories,
  onRestart,
  onRemove,
  restartPending,
  removePending,
}: FailedTasksCardProps) {
  const total = categories.reduce((sum, [, count]) => sum + count, 0);
  if (total === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-destructive" /> {title}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRestart}
            disabled={restartPending}
          >
            <RotateCcw className="mr-1 size-3" /> Restart All
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onRemove}
            disabled={removePending}
          >
            <Trash2 className="mr-1 size-3" /> Remove All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {categories.map(([name, count]) => (
            <div
              key={name}
              className="rounded border border-border p-2 text-center"
            >
              <p className="text-xs text-muted-foreground">{name}</p>
              <p
                className={`text-lg font-bold ${count > 0 ? "text-destructive" : ""}`}
              >
                {count}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
