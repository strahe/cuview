import { FileText, Plus } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConfigTopologyNodeView } from "../-module/types";

interface LayerSidebarProps {
  layers: string[];
  layersLoading: boolean;
  topology: ConfigTopologyNodeView[];
  selectedLayer: string;
  onSelectLayer: (name: string) => void;
  onCreateClick: () => void;
}

export function LayerSidebar({
  layers,
  layersLoading,
  topology,
  selectedLayer,
  onSelectLayer,
  onCreateClick,
}: LayerSidebarProps) {
  const nodeCountByLayer = useMemo(() => {
    const counts = new Map<string, number>();
    for (const node of topology) {
      for (const layer of node.layers) {
        counts.set(layer, (counts.get(layer) ?? 0) + 1);
      }
    }
    return counts;
  }, [topology]);

  return (
    <Card className="flex min-h-0 flex-col xl:col-span-1 xl:max-h-[calc(100vh-12rem)]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Layers</CardTitle>
        <Button size="sm" variant="outline" onClick={onCreateClick}>
          <Plus className="mr-1 size-3.5" />
          New
        </Button>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {layersLoading ? (
          <div className="space-y-2 px-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={`skel-${i}`} className="h-9" />
            ))}
          </div>
        ) : (
          <nav
            className="flex flex-col gap-0.5"
            aria-label="Configuration layers"
          >
            {layers.map((name) => {
              const nodeCount = nodeCountByLayer.get(name) ?? 0;
              const isSelected = selectedLayer === name;
              return (
                <Button
                  key={name}
                  type="button"
                  onClick={() => onSelectLayer(name)}
                  className={`group relative flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  variant="ghost"
                >
                  {isSelected && (
                    <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary" />
                  )}
                  <FileText className="size-4 shrink-0" />
                  <span className="truncate">{name}</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    {nodeCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="px-1.5 py-0 text-[10px] leading-4"
                      >
                        {nodeCount}
                      </Badge>
                    )}
                    {name === "default" && (
                      <Badge
                        variant="outline"
                        className="px-1.5 py-0 text-[10px] leading-4"
                      >
                        default
                      </Badge>
                    )}
                  </div>
                </Button>
              );
            })}
          </nav>
        )}
      </CardContent>
    </Card>
  );
}
