import type { IChangeEvent } from "@rjsf/core";
import Form from "@rjsf/shadcn";
import type { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { AlertCircle, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurioApi } from "@/contexts/curio-api-context";
import {
  fetchConfigDefaults,
  fetchConfigLayer,
  fetchConfigSchema,
  saveConfigLayer,
} from "@/services/config-api";
import { mergeDeep } from "@/utils/object";

interface ConfigVisualEditorProps {
  layerName: string;
  onStatusMessage: (msg: string) => void;
}

export function ConfigVisualEditor({
  layerName,
  onStatusMessage,
}: ConfigVisualEditorProps) {
  const api = useCurioApi();
  const isDefault = layerName === "default";

  const [schema, setSchema] = useState<RJSFSchema | null>(null);
  const [defaults, setDefaults] = useState<Record<string, unknown> | null>(
    null,
  );
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load schema, defaults, and layer data
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [schemaData, defaultsData, layerData] = await Promise.all([
          fetchConfigSchema(api),
          fetchConfigDefaults(api),
          fetchConfigLayer(api, layerName),
        ]);

        if (cancelled) return;

        setSchema(schemaData as RJSFSchema);
        setDefaults(defaultsData);

        // Merge defaults with layer overrides for initial form data
        const merged = mergeDeep(defaultsData ?? {}, layerData ?? {});
        setFormData(merged as Record<string, unknown>);
      } catch (err) {
        if (!cancelled) {
          setError(`Failed to load configuration: ${err}`);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [api, layerName]);

  const handleChange = useCallback((e: IChangeEvent) => {
    setFormData(e.formData);
  }, []);

  const handleSave = useCallback(async () => {
    if (isDefault) return;
    setSaving(true);
    onStatusMessage("");

    try {
      // Compute the diff: only save fields that differ from defaults
      const overrides = computeOverrides(defaults ?? {}, formData);
      await saveConfigLayer(api, layerName, overrides);
      onStatusMessage("Saved successfully");
    } catch (err) {
      onStatusMessage(`Error saving: ${err}`);
    } finally {
      setSaving(false);
    }
  }, [api, layerName, formData, defaults, isDefault, onStatusMessage]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        {error}
      </Alert>
    );
  }

  if (!schema) {
    return (
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        No configuration schema available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Save button */}
      {!isDefault && (
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="mr-1 size-4" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      )}

      {isDefault && (
        <Alert variant="warning">The default layer is read-only.</Alert>
      )}

      {/* RJSF Form with shadcn theme */}
      <Form
        schema={schema}
        formData={formData}
        onChange={handleChange}
        validator={validator}
        readonly={isDefault}
        disabled={isDefault}
        liveValidate
        showErrorList={false}
        noHtml5Validate
      />
    </div>
  );
}

/**
 * Compute the difference between defaults and current formData.
 * Only includes fields that differ from their default values.
 */
function computeOverrides(
  defaults: Record<string, unknown>,
  current: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(current)) {
    const defaultVal = defaults[key];
    const currentVal = current[key];

    if (currentVal === undefined || currentVal === null) {
      continue;
    }

    if (
      typeof currentVal === "object" &&
      !Array.isArray(currentVal) &&
      typeof defaultVal === "object" &&
      defaultVal !== null &&
      !Array.isArray(defaultVal)
    ) {
      const nested = computeOverrides(
        defaultVal as Record<string, unknown>,
        currentVal as Record<string, unknown>,
      );
      if (Object.keys(nested).length > 0) {
        result[key] = nested;
      }
    } else if (!deepEquals(defaultVal, currentVal)) {
      result[key] = currentVal;
    }
  }

  return result;
}

function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEquals(item, b[i]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) =>
      deepEquals(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
    );
  }
  return false;
}
