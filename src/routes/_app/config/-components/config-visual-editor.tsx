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
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  CircleHelp,
} from "lucide-react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConfigSchemaDocument } from "@/types/config";
import { mergeDeep } from "@/utils/object";
import { useConfigEditorBundle } from "../-module/queries";

interface ConfigVisualEditorProps {
  layerName: string;
  infoDisplayMode: "icon" | "inline";
}

export interface ConfigVisualEditorHandle {
  save: () => Promise<Record<string, unknown>>;
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
>(function ConfigVisualEditor({ layerName, infoDisplayMode }, ref) {
  const { schema, defaults, layerData, isLoading, error } =
    useConfigEditorBundle(layerName);

  const mergedData = useMemo(
    () => mergeDeep(defaults ?? {}, layerData ?? {}) as Record<string, unknown>,
    [defaults, layerData],
  );

  if (isLoading) {
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
        <AlertDescription>
          Failed to load configuration: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!schema) {
    return (
      <p className="text-sm text-muted-foreground">
        No configuration schema available.
      </p>
    );
  }

  return (
    <ConfigVisualEditorForm
      ref={ref}
      schema={schema}
      defaults={defaults}
      initialData={mergedData}
      layerName={layerName}
      infoDisplayMode={infoDisplayMode}
    />
  );
});

interface ConfigVisualEditorFormProps {
  schema: ConfigSchemaDocument;
  defaults: Record<string, unknown> | null;
  initialData: Record<string, unknown>;
  layerName: string;
  infoDisplayMode: "icon" | "inline";
}

const ConfigVisualEditorForm = forwardRef<
  ConfigVisualEditorHandle,
  ConfigVisualEditorFormProps
>(function ConfigVisualEditorForm(
  { schema, defaults, initialData, layerName, infoDisplayMode },
  ref,
) {
  const isDefault = layerName === "default";

  // Snapshot defaults at mount for accurate diff computation.
  // Parent keys us by layerName, so we remount on layer switch.
  const [snapshotDefaults] = useState<Record<string, unknown> | null>(
    () => defaults,
  );
  const [formData, setFormData] =
    useState<Record<string, unknown>>(initialData);

  const handleChange = useCallback((e: IChangeEvent) => {
    setFormData(e.formData);
  }, []);

  const save = useCallback(async () => {
    if (isDefault) return {};
    return computeOverrides(snapshotDefaults ?? {}, formData);
  }, [snapshotDefaults, formData, isDefault]);

  useImperativeHandle(ref, () => ({ save }), [save]);

  return (
    <div className="space-y-4">
      {isDefault && (
        <Alert className="border-warning/50 text-warning">
          <AlertTriangle className="size-4" />
          <AlertDescription>The default layer is read-only.</AlertDescription>
        </Alert>
      )}

      <Form
        schema={schema as RJSFSchema}
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
            <Label
              className={`text-sm font-medium leading-none ${
                hasErrors ? "text-destructive" : ""
              }`}
              htmlFor={id}
            >
              {label}
              {required ? "*" : null}
            </Label>
            {descriptionText && resolvedInfoDisplayMode === "icon" && (
              <Button
                type="button"
                title={descriptionText.trim()}
                aria-label={descriptionText.trim()}
                className="size-5 text-muted-foreground hover:text-foreground"
                size="icon-xs"
                variant="ghost"
              >
                <CircleHelp className="size-3.5" />
              </Button>
            )}
          </div>
        )}
        {children}
        {descriptionText && resolvedInfoDisplayMode === "inline" && (
          <p
            className={`text-xs ${
              hasErrors ? "text-destructive" : "text-muted-foreground"
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
                <div className="w-full border-l-2 border-border pl-3">
                  {element.content}
                </div>
              </div>
            );
          }

          return (
            <details
              key={`${element.name}-${index}`}
              open
              className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 bg-muted/[0.45] px-3 py-2.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                <span>{formatSectionTitle(element.name)}</span>
                <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-3 border-t border-border p-3">
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
