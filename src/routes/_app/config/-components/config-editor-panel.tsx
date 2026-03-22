import {
  AlertTriangle,
  CircleHelp,
  Code,
  Eye,
  History,
  Save,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCurioApi } from "@/contexts/curio-api-context";
import { fetchConfigLayer } from "@/services/config-api";
import {
  useConfigEditorBundle,
  useSaveLayerMutation,
} from "../-module/queries";
import type { ConfigEditMode, ConfigInfoDisplay } from "../-module/types";
import {
  ConfigVisualEditor,
  type ConfigVisualEditorHandle,
} from "./config-visual-editor";
import { HistoryDialog } from "./history-dialog";

interface ConfigEditorPanelProps {
  layerName: string;
  mode: ConfigEditMode;
  infoDisplay: ConfigInfoDisplay;
  onModeChange: (mode: ConfigEditMode) => void;
  onInfoDisplayChange: (display: ConfigInfoDisplay) => void;
}

export function ConfigEditorPanel({
  layerName,
  mode,
  infoDisplay,
  onModeChange,
  onInfoDisplayChange,
}: ConfigEditorPanelProps) {
  const api = useCurioApi();
  const isDefault = layerName === "default";
  const visualEditorRef = useRef<ConfigVisualEditorHandle | null>(null);
  const saveMutation = useSaveLayerMutation(layerName);

  const [jsonContent, setJsonContent] = useState<string>("");
  const [jsonLoaded, setJsonLoaded] = useState(false);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusIsError, setStatusIsError] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hasRestoredJsonDraft, setHasRestoredJsonDraft] = useState(false);

  const { schema, isLoading: bundleLoading } = useConfigEditorBundle(layerName);

  // Load raw JSON when switching to JSON mode
  const loadJsonContent = useCallback(async () => {
    setJsonLoading(true);
    try {
      const data = await fetchConfigLayer(api, layerName);
      setJsonContent(JSON.stringify(data, null, 2));
      setJsonLoaded(true);
    } catch (err) {
      setStatusMsg(`Error loading layer: ${err}`);
      setStatusIsError(true);
    } finally {
      setJsonLoading(false);
    }
  }, [api, layerName]);

  const handleModeSwitch = useCallback(
    (newMode: string) => {
      const m = newMode as ConfigEditMode;

      if (m === "visual" && hasRestoredJsonDraft) {
        setStatusMsg("Save the restored JSON before switching to Visual.");
        setStatusIsError(true);
        return;
      }

      onModeChange(m);
      if (m === "json" && !jsonLoaded) {
        loadJsonContent();
      }
    },
    [hasRestoredJsonDraft, onModeChange, jsonLoaded, loadJsonContent],
  );

  const handleJsonSave = useCallback(() => {
    if (isDefault) return;
    setStatusMsg(null);
    setStatusIsError(false);
    try {
      const payload = JSON.parse(jsonContent);
      saveMutation.mutate(payload, {
        onSuccess: () => {
          setHasRestoredJsonDraft(false);
          setStatusMsg("Saved successfully");
        },
        onError: (err) => {
          setStatusMsg(`Error saving: ${err}`);
          setStatusIsError(true);
        },
      });
    } catch (err) {
      setStatusMsg(`Error saving: invalid JSON — ${err}`);
      setStatusIsError(true);
    }
  }, [jsonContent, isDefault, saveMutation]);

  const handleVisualSave = useCallback(async () => {
    if (isDefault) return;
    if (!visualEditorRef.current) {
      setStatusMsg("Error saving: visual editor is not ready");
      setStatusIsError(true);
      return;
    }
    setStatusMsg(null);
    setStatusIsError(false);
    try {
      const payload = await visualEditorRef.current.save();
      saveMutation.mutate(payload, {
        onSuccess: () => {
          setHasRestoredJsonDraft(false);
          setStatusMsg("Saved successfully");
        },
        onError: (err) => {
          setStatusMsg(`Error saving: ${err}`);
          setStatusIsError(true);
        },
      });
    } catch (err) {
      setStatusMsg(`Error saving: ${err}`);
      setStatusIsError(true);
    }
  }, [isDefault, saveMutation]);

  const handleSave = mode === "json" ? handleJsonSave : handleVisualSave;
  const isSaving = saveMutation.isPending;

  const toggleInfoDisplay = useCallback(() => {
    onInfoDisplayChange(infoDisplay === "icon" ? "inline" : "icon");
  }, [infoDisplay, onInfoDisplayChange]);

  const handleRestore = useCallback(
    (content: string) => {
      setJsonContent(content);
      setJsonLoaded(true);
      setHasRestoredJsonDraft(true);
      onModeChange("json");
      setShowHistory(false);
      setStatusMsg("Restored from history — review and save to apply.");
      setStatusIsError(false);
    },
    [onModeChange],
  );

  return (
    <Card className="flex min-h-0 flex-col xl:col-span-3 xl:max-h-[calc(100vh-12rem)]">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="truncate">Layer: {layerName}</CardTitle>
        <div className="flex shrink-0 items-center gap-2">
          <Tabs value={mode} onValueChange={handleModeSwitch}>
            <TabsList>
              <TabsTrigger value="visual">
                <Eye className="mr-1 size-3.5" />
                Visual
              </TabsTrigger>
              <TabsTrigger value="json">
                <Code className="mr-1 size-3.5" />
                JSON
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHistory(true)}
          >
            <History className="mr-1 size-4" />
            History
          </Button>
          {mode === "visual" && (
            <Button
              size="sm"
              variant={infoDisplay === "inline" ? "default" : "outline"}
              onClick={toggleInfoDisplay}
            >
              <CircleHelp className="mr-1 size-4" />
              {infoDisplay === "inline" ? "Info Expanded" : "Info"}
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isDefault || isSaving}
          >
            <Save className="mr-1 size-4" />
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {isDefault && (
          <Alert className="border-warning/50 text-warning">
            <AlertTriangle className="size-4" />
            <AlertDescription>The default layer is read-only.</AlertDescription>
          </Alert>
        )}

        {statusMsg && (
          <div
            className={`rounded-md p-3 text-sm ${
              statusIsError
                ? "bg-destructive/[0.1] text-destructive"
                : "bg-success/10 text-success"
            }`}
          >
            {statusMsg}
          </div>
        )}

        {mode === "visual" ? (
          bundleLoading && !schema ? (
            <div className="space-y-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-48" />
            </div>
          ) : (
            <ConfigVisualEditor
              ref={visualEditorRef}
              key={layerName}
              layerName={layerName}
              infoDisplayMode={infoDisplay}
            />
          )
        ) : jsonLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <Textarea
            value={jsonContent}
            onChange={(e) => setJsonContent(e.target.value)}
            className="min-h-96 font-mono text-xs"
            disabled={isDefault}
          />
        )}
      </CardContent>

      <HistoryDialog
        layer={layerName}
        open={showHistory}
        onOpenChange={setShowHistory}
        onRestore={handleRestore}
      />
    </Card>
  );
}
