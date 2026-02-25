import { createFileRoute } from "@tanstack/react-router";
import {
  CircleHelp,
  Code,
  Eye,
  FileText,
  History,
  Plus,
  Save,
  Settings,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import {
  ConfigVisualEditor,
  type ConfigVisualEditorHandle,
} from "@/components/composed/config/config-visual-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCurioApi } from "@/contexts/curio-api-context";
import { useCurioRest } from "@/hooks/use-curio-query";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  type ConfigHistoryEntry,
  createConfigLayer,
  fetchConfigHistory,
  fetchConfigLayer,
  saveConfigLayer,
} from "@/services/config-api";
import type { ConfigTopologyEntry } from "@/types/config";

export const Route = createFileRoute("/_app/config/")({
  component: ConfigPage,
});

function ConfigPage() {
  usePageTitle("Configuration");
  const api = useCurioApi();

  const {
    data: layers,
    isLoading: layersLoading,
    refetch: refetchLayers,
  } = useCurioRest<string[]>("/api/config/layers", { refetchInterval: 60_000 });

  const { data: topology } = useCurioRest<ConfigTopologyEntry[]>(
    "/api/config/topo",
    { refetchInterval: 60_000 },
  );

  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [layerContent, setLayerContent] = useState<string>("");
  const [loadingLayer, setLoadingLayer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [visualSaving, setVisualSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [newLayerName, setNewLayerName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<ConfigHistoryEntry[]>(
    [],
  );
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editMode, setEditMode] = useState<"visual" | "json">(() => {
    const saved = localStorage.getItem("cuview-config-edit-mode");
    return saved === "json" ? "json" : "visual";
  });
  const [infoDisplayMode, setInfoDisplayMode] = useState<"icon" | "inline">(
    () => {
      const saved = localStorage.getItem("cuview-config-info-display-mode");
      return saved === "inline" ? "inline" : "icon";
    },
  );
  const visualEditorRef = useRef<ConfigVisualEditorHandle | null>(null);

  const loadLayer = useCallback(
    async (name: string) => {
      setSelectedLayer(name);
      setStatusMsg(null);
      // Only load raw JSON content when in JSON edit mode
      if (editMode === "json") {
        setLoadingLayer(true);
        try {
          const data = await fetchConfigLayer(api, name);
          setLayerContent(JSON.stringify(data, null, 2));
        } catch (err) {
          setStatusMsg(`Error loading layer: ${err}`);
        } finally {
          setLoadingLayer(false);
        }
      }
    },
    [api, editMode],
  );

  const handleSave = useCallback(async () => {
    if (!selectedLayer) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      const payload = JSON.parse(layerContent);
      await saveConfigLayer(api, selectedLayer, payload);
      setStatusMsg("Saved successfully");
    } catch (err) {
      setStatusMsg(`Error saving: ${err}`);
    } finally {
      setSaving(false);
    }
  }, [api, selectedLayer, layerContent]);

  const handleVisualSave = useCallback(async () => {
    if (!selectedLayer || selectedLayer === "default") return;
    if (!visualEditorRef.current) {
      setStatusMsg("Error saving: visual editor is not ready");
      return;
    }
    setVisualSaving(true);
    setStatusMsg(null);
    try {
      await visualEditorRef.current.save();
    } finally {
      setVisualSaving(false);
    }
  }, [selectedLayer]);

  const handleCreate = useCallback(async () => {
    if (!newLayerName.trim()) return;
    try {
      await createConfigLayer(api, newLayerName.trim());
      setNewLayerName("");
      setShowCreate(false);
      refetchLayers();
      setStatusMsg("Layer created");
    } catch (err) {
      setStatusMsg(`Error creating layer: ${err}`);
    }
  }, [api, newLayerName, refetchLayers]);

  const loadHistory = useCallback(async () => {
    if (!selectedLayer) return;
    setLoadingHistory(true);
    try {
      const entries = await fetchConfigHistory(api, selectedLayer);
      setHistoryEntries(entries);
      setShowHistory(true);
    } catch (err) {
      setStatusMsg(`Error loading history: ${err}`);
    } finally {
      setLoadingHistory(false);
    }
  }, [api, selectedLayer]);

  const switchEditMode = useCallback(
    (mode: "visual" | "json") => {
      setEditMode(mode);
      localStorage.setItem("cuview-config-edit-mode", mode);
      // Reload layer content for raw JSON mode when switching
      if (mode === "json" && selectedLayer) {
        loadLayer(selectedLayer);
      }
    },
    [selectedLayer, loadLayer],
  );

  const toggleInfoDisplayMode = useCallback(() => {
    setInfoDisplayMode((current) => {
      const next = current === "icon" ? "inline" : "icon";
      localStorage.setItem("cuview-config-info-display-mode", next);
      return next;
    });
  }, []);

  return (
    <div className="flex min-h-0 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="size-5" />
          <h1 className="text-2xl font-bold tracking-tight">Configuration</h1>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-1 size-4" /> New Layer
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Input
              placeholder="Layer name"
              value={newLayerName}
              onChange={(e) => setNewLayerName(e.target.value)}
              className="max-w-xs"
            />
            <Button size="sm" onClick={handleCreate}>
              Create
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {statusMsg && (
        <div
          className={`rounded-md p-3 text-sm ${
            statusMsg.startsWith("Error")
              ? "bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]"
              : "bg-[hsl(var(--success,142_76%_36%)/0.1)] text-[hsl(var(--success,142_76%_36%))]"
          }`}
        >
          {statusMsg}
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-4">
        <Card className="flex min-h-0 flex-col xl:col-span-1 xl:max-h-[calc(100vh-12rem)]">
          <CardHeader>
            <CardTitle>Layers</CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
            {layersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {(layers ?? []).map((name) => (
                  <button
                    key={name}
                    onClick={() => loadLayer(name)}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-[hsl(var(--muted))] ${
                      selectedLayer === name
                        ? "bg-[hsl(var(--muted))] font-medium"
                        : ""
                    }`}
                  >
                    <FileText className="size-3.5" />
                    {name}
                    {name === "default" && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        default
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}

            {topology && topology.length > 0 && (
              <div className="space-y-2 border-t border-[hsl(var(--border))] pt-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Topology</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Topology = node/worker to layer mapping.
                  </p>
                </div>
                <div className="space-y-2">
                  {topology.map((entry, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-[hsl(var(--border))] p-2"
                    >
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-medium">
                          {entry.Name || `Node ${entry.ID}`}
                        </span>
                        <span className="text-[hsl(var(--muted-foreground))]">
                          →
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {entry.LayersCSV.split(",")
                          .filter(Boolean)
                          .map((layer) => (
                            <Badge key={layer} variant="outline">
                              {layer.trim()}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col xl:col-span-3 xl:max-h-[calc(100vh-12rem)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {selectedLayer ? `Layer: ${selectedLayer}` : "Select a layer"}
            </CardTitle>
            {selectedLayer && (
              <div className="flex items-center gap-2">
                <Tabs>
                  <TabsList>
                    <TabsTrigger
                      active={editMode === "visual"}
                      onClick={() => switchEditMode("visual")}
                    >
                      <Eye className="mr-1 size-3.5" />
                      Visual
                    </TabsTrigger>
                    <TabsTrigger
                      active={editMode === "json"}
                      onClick={() => switchEditMode("json")}
                    >
                      <Code className="mr-1 size-3.5" />
                      JSON
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadHistory}
                  disabled={loadingHistory}
                >
                  <History className="mr-1 size-4" />
                  {loadingHistory ? "Loading…" : "History"}
                </Button>
                {editMode === "visual" && (
                  <Button
                    size="sm"
                    variant={
                      infoDisplayMode === "inline" ? "default" : "outline"
                    }
                    onClick={toggleInfoDisplayMode}
                  >
                    <CircleHelp className="mr-1 size-4" />
                    {infoDisplayMode === "inline" ? "Info Expanded" : "Info"}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={editMode === "json" ? handleSave : handleVisualSave}
                  disabled={
                    selectedLayer === "default" ||
                    (editMode === "json" ? saving : visualSaving)
                  }
                >
                  <Save className="mr-1 size-4" />
                  {editMode === "json"
                    ? saving
                      ? "Saving…"
                      : "Save"
                    : visualSaving
                      ? "Saving…"
                      : "Save"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto">
            {!selectedLayer ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Select a configuration layer to view and edit.
              </p>
            ) : editMode === "visual" ? (
              <ConfigVisualEditor
                ref={visualEditorRef}
                key={selectedLayer}
                layerName={selectedLayer}
                onStatusMessage={setStatusMsg}
                infoDisplayMode={infoDisplayMode}
              />
            ) : loadingLayer ? (
              <Skeleton className="h-96" />
            ) : (
              <Textarea
                value={layerContent}
                onChange={(e) => setLayerContent(e.target.value)}
                className="min-h-96 font-mono text-xs"
                disabled={selectedLayer === "default"}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Config History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent
          onClose={() => setShowHistory(false)}
          className="max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle>History: {selectedLayer}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {historyEntries.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                No history entries.
              </p>
            ) : (
              historyEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="cursor-pointer rounded border border-[hsl(var(--border))] p-3 text-sm hover:bg-[hsl(var(--muted))]"
                  onClick={() => {
                    setLayerContent(entry.content);
                    setShowHistory(false);
                    setStatusMsg(`Loaded version #${entry.id}`);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Version #{entry.id}</span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {entry.created_at}
                    </span>
                  </div>
                  <pre className="mt-1 max-h-24 overflow-hidden text-xs text-[hsl(var(--muted-foreground))]">
                    {entry.content?.slice(0, 200)}
                    {entry.content?.length > 200 ? "…" : ""}
                  </pre>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
