import type { IChangeEvent } from "@rjsf/core";
import Form from "@rjsf/shadcn";
import {
  buttonId,
  canExpand,
  descriptionId,
  type FieldTemplateProps,
  type FormContextType,
  getTemplate,
  getUiOptions,
  type ObjectFieldTemplateProps,
  type RJSFSchema,
  type StrictRJSFSchema,
  titleId,
} from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { AlertCircle, ChevronDown, CircleHelp } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Alert } from "@/components/ui/alert";
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
  infoDisplayMode: "icon" | "inline";
}

export interface ConfigVisualEditorHandle {
  save: () => Promise<void>;
}

interface ConfigFormContext extends FormContextType {
  infoDisplayMode?: "icon" | "inline";
}

const formUiSchema = {
  "ui:submitButtonOptions": {
    norender: true,
  },
} as const;

export const ConfigVisualEditor = forwardRef<
  ConfigVisualEditorHandle,
  ConfigVisualEditorProps
>(function ConfigVisualEditor(
  { layerName, onStatusMessage, infoDisplayMode },
  ref,
) {
  const api = useCurioApi();
  const isDefault = layerName === "default";

  const [schema, setSchema] = useState<RJSFSchema | null>(null);
  const [defaults, setDefaults] = useState<Record<string, unknown> | null>(
    null,
  );
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const save = useCallback(async () => {
    if (isDefault || isSaving) return;
    setIsSaving(true);
    onStatusMessage("");

    try {
      // Compute the diff: only save fields that differ from defaults
      const overrides = computeOverrides(defaults ?? {}, formData);
      await saveConfigLayer(api, layerName, overrides);
      onStatusMessage("Saved successfully");
    } catch (err) {
      onStatusMessage(`Error saving: ${err}`);
    } finally {
      setIsSaving(false);
    }
  }, [
    api,
    layerName,
    formData,
    defaults,
    isDefault,
    isSaving,
    onStatusMessage,
  ]);
  useImperativeHandle(
    ref,
    () => ({
      save,
    }),
    [save],
  );

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
      {isDefault && (
        <Alert variant="warning">The default layer is read-only.</Alert>
      )}

      {/* RJSF Form with shadcn theme */}
      <Form
        schema={schema}
        formData={formData}
        uiSchema={formUiSchema}
        formContext={{ infoDisplayMode }}
        onChange={handleChange}
        validator={validator}
        templates={{
          FieldTemplate: ConfigFieldTemplate,
          ObjectFieldTemplate: ConfigObjectFieldTemplate,
        }}
        readonly={isDefault}
        disabled={isDefault}
        liveValidate
        showErrorList={false}
        noHtml5Validate
      />
    </div>
  );
});

function ConfigFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = ConfigFormContext,
>({
  id,
  children,
  displayLabel,
  rawErrors = [],
  errors,
  help,
  rawDescription,
  classNames,
  style,
  disabled,
  label,
  hidden,
  onKeyRename,
  onKeyRenameBlur,
  onRemoveProperty,
  readonly,
  required,
  schema,
  uiSchema,
  registry,
}: FieldTemplateProps<T, S, F>) {
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<
    "WrapIfAdditionalTemplate",
    T,
    S,
    F
  >("WrapIfAdditionalTemplate", registry, uiOptions);
  if (hidden) {
    return <div className="hidden">{children}</div>;
  }

  const resolvedInfoDisplayMode =
    (registry.formContext as ConfigFormContext | undefined)?.infoDisplayMode ??
    "icon";
  const isCheckbox = uiOptions.widget === "checkbox";
  const descriptionText = getFieldHelpText(schema, rawDescription);
  const hasErrors = rawErrors.length > 0;

  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      style={style}
      disabled={disabled}
      id={id}
      label={label}
      displayLabel={displayLabel}
      onKeyRename={onKeyRename}
      onKeyRenameBlur={onKeyRenameBlur}
      onRemoveProperty={onRemoveProperty}
      rawDescription={rawDescription}
      readonly={readonly}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    >
      <div className="flex flex-col gap-2">
        {displayLabel && !isCheckbox && (
          <div className="flex items-center gap-1.5">
            <label
              className={`text-sm font-medium leading-none ${
                hasErrors ? "text-[hsl(var(--destructive))]" : ""
              }`}
              htmlFor={id}
            >
              {label}
              {required ? "*" : null}
            </label>
            {descriptionText && resolvedInfoDisplayMode === "icon" && (
              <button
                type="button"
                title={descriptionText.trim()}
                aria-label={descriptionText.trim()}
                className="inline-flex size-5 items-center justify-center rounded text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              >
                <CircleHelp className="size-3.5" />
              </button>
            )}
          </div>
        )}
        {children}
        {descriptionText && resolvedInfoDisplayMode === "inline" && (
          <p
            className={`text-xs ${
              hasErrors
                ? "text-[hsl(var(--destructive))]"
                : "text-[hsl(var(--muted-foreground))]"
            }`}
          >
            {descriptionText}
          </p>
        )}
        {errors}
        {help}
      </div>
    </WrapIfAdditionalTemplate>
  );
}

function ConfigObjectFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = Record<string, never>,
>({
  description,
  title,
  properties,
  required,
  uiSchema,
  fieldPathId,
  schema,
  formData,
  optionalDataControl,
  onAddProperty,
  disabled,
  readonly,
  registry,
}: ObjectFieldTemplateProps<T, S, F>) {
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<"TitleFieldTemplate", T, S, F>(
    "TitleFieldTemplate",
    registry,
    uiOptions,
  );
  const DescriptionFieldTemplate = getTemplate<
    "DescriptionFieldTemplate",
    T,
    S,
    F
  >("DescriptionFieldTemplate", registry, uiOptions);
  const showOptionalDataControlInTitle = !readonly && !disabled;
  const isRootObject = fieldPathId.$id === "root";

  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  return (
    <>
      {title && (
        <TitleFieldTemplate
          id={titleId(fieldPathId)}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
          optionalDataControl={
            showOptionalDataControlInTitle ? optionalDataControl : undefined
          }
        />
      )}
      {description && (
        <DescriptionFieldTemplate
          id={descriptionId(fieldPathId)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <div className="flex flex-col gap-2">
        {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
        {properties.map((element, index) => {
          if (element.hidden) {
            return (
              <div key={`${element.name}-${index}`} className="hidden">
                {element.content}
              </div>
            );
          }

          if (!isRootObject) {
            return (
              <div key={`${element.name}-${index}`} className="flex">
                <div className="w-full border-l-2 border-[hsl(var(--border))] pl-3">
                  {element.content}
                </div>
              </div>
            );
          }

          return (
            <details
              key={`${element.name}-${index}`}
              open
              className="group overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 bg-[hsl(var(--muted)/0.45)] px-3 py-2.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                <span>{formatSectionTitle(element.name)}</span>
                <ChevronDown className="size-4 text-[hsl(var(--muted-foreground))] transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-3 border-t border-[hsl(var(--border))] p-3">
                {element.content}
              </div>
            </details>
          );
        })}
        {canExpand(schema, uiSchema, formData) ? (
          <div className="mt-2 flex justify-end">
            <AddButton
              id={buttonId(fieldPathId, "add")}
              onClick={onAddProperty}
              disabled={disabled || readonly}
              className="rjsf-object-property-expand"
              uiSchema={uiSchema}
              registry={registry}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}

function formatSectionTitle(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function getFieldHelpText(schema: RJSFSchema, rawDescription: unknown): string {
  const schemaInfoText = (
    schema as RJSFSchema & {
      options?: {
        infoText?: unknown;
      };
    }
  ).options?.infoText;

  if (typeof schemaInfoText === "string" && schemaInfoText.trim()) {
    return schemaInfoText.trim();
  }
  if (typeof schema.description === "string" && schema.description.trim()) {
    return schema.description.trim();
  }
  if (typeof rawDescription === "string" && rawDescription.trim()) {
    return rawDescription.trim();
  }
  return "";
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

    if (currentVal === undefined) {
      continue;
    }

    if (
      typeof currentVal === "object" &&
      currentVal !== null &&
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
