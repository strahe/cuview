import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  usePdpBulkRemoveFailed,
  usePdpBulkRestartFailed,
} from "../-module/queries";
import type {
  PdpFailedTaskType,
  PdpPipelineFailedStats,
} from "../-module/types";

interface PipelineFailedTasksProps {
  stats: PdpPipelineFailedStats | null | undefined;
}

const taskTypes: {
  key: keyof PdpPipelineFailedStats;
  label: string;
  type: PdpFailedTaskType;
}[] = [
  { key: "DownloadingFailed", label: "Downloading", type: "downloading" },
  { key: "CommPFailed", label: "CommP", type: "commp" },
  { key: "AggFailed", label: "Aggregate", type: "aggregate" },
  { key: "AddPieceFailed", label: "Add Piece", type: "add_piece" },
  { key: "SaveCacheFailed", label: "Save Cache", type: "save_cache" },
  { key: "IndexFailed", label: "Indexing", type: "index" },
];

export function PipelineFailedTasks({ stats }: PipelineFailedTasksProps) {
  const restartMutation = usePdpBulkRestartFailed();
  const removeMutation = usePdpBulkRemoveFailed();

  if (!stats) return null;

  const hasFailures = taskTypes.some((t) => (stats[t.key] ?? 0) > 0);
  if (!hasFailures) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-4" /> Failed Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {taskTypes.map((t) => {
            const count = stats[t.key] ?? 0;
            if (count === 0) return null;
            const isWorking =
              (restartMutation.isPending &&
                restartMutation.variables?.[0] === t.type) ||
              (removeMutation.isPending &&
                removeMutation.variables?.[0] === t.type);

            return (
              <div
                key={t.type}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <span className="text-sm">
                  <span className="font-medium">{t.label}</span>{" "}
                  <span className="text-muted-foreground">
                    — {count} failed
                  </span>
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isWorking}
                    onClick={() => restartMutation.mutate([t.type])}
                  >
                    <RefreshCw className="mr-1 size-3" />
                    {isWorking ? "..." : "Restart All"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isWorking}
                    onClick={() => removeMutation.mutate([t.type])}
                  >
                    <Trash2 className="mr-1 size-3" />
                    {isWorking ? "..." : "Remove All"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
