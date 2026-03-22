import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { ConfigEditorPanel } from "./-components/config-editor-panel";
import { CreateLayerDialog } from "./-components/create-layer-dialog";
import { LayerSidebar } from "./-components/layer-sidebar";
import { useConfigLayers, useConfigTopology } from "./-module/queries";
import {
  normalizeConfigSearch,
  patchConfigSearch,
} from "./-module/search-state";
import type { ConfigSearchPatch } from "./-module/types";

export const Route = createFileRoute("/_app/config/editor")({
  validateSearch: (search) =>
    normalizeConfigSearch(search as Record<string, unknown>),
  component: EditorPage,
});

function EditorPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: layers = [], isLoading: layersLoading } = useConfigLayers();
  const { data: topology = [] } = useConfigTopology();

  const updateSearch = useCallback(
    (patch: ConfigSearchPatch) => {
      navigate({
        search: (prev) => patchConfigSearch(prev as typeof search, patch),
        replace: true,
      });
    },
    [navigate],
  );

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-4">
        <LayerSidebar
          layers={layers}
          layersLoading={layersLoading}
          topology={topology}
          selectedLayer={search.layer}
          onSelectLayer={(name) => updateSearch({ layer: name })}
          onCreateClick={() => setShowCreateDialog(true)}
        />

        {search.layer ? (
          <ConfigEditorPanel
            key={search.layer}
            layerName={search.layer}
            mode={search.mode}
            infoDisplay={search.infoDisplay}
            onModeChange={(mode) => updateSearch({ mode })}
            onInfoDisplayChange={(infoDisplay) => updateSearch({ infoDisplay })}
          />
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border/50 p-12 text-center text-muted-foreground xl:col-span-3">
            <div>
              <p className="text-lg font-medium">No layer selected</p>
              <p className="mt-1 text-sm">
                Select a layer from the sidebar to edit its configuration.
              </p>
            </div>
          </div>
        )}
      </div>

      <CreateLayerDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={(name) => updateSearch({ layer: name })}
      />
    </>
  );
}
