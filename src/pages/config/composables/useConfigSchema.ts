import { computed, ref, type Ref } from "vue";
import type { FormKitSchemaNode } from "@formkit/core";
import type {
  JSONSchema,
  JSONSchemaProperty,
  JSONSchemaDef,
  FormKitConfigSection,
  FormKitFieldDefinition,
} from "@/types/config";

export function useConfigSchema(schema: Ref<JSONSchema | null>) {
  const parsedSections = ref<FormKitConfigSection[]>([]);
  const fieldDefinitions = ref<Record<string, FormKitFieldDefinition>>({});

  const parseJsonSchemaToFormKit = (jsonSchema: JSONSchema): FormKitConfigSection[] => {
    if (!jsonSchema || !jsonSchema.$defs) {
      return [];
    }

    const sections: FormKitConfigSection[] = [];
    const rootDef = jsonSchema.$defs.CurioConfig;

    if (!rootDef?.properties) {
      return sections;
    }

    for (const [sectionKey, sectionProp] of Object.entries(rootDef.properties)) {
      const section = parseConfigSection(
        sectionKey,
        sectionProp,
        jsonSchema.$defs,
        ""
      );
      if (section) {
        sections.push(section);
      }
    }

    return sections;
  };

  const parseConfigSection = (
    key: string,
    property: JSONSchemaProperty,
    definitions: Record<string, JSONSchemaDef>,
    parentPath: string
  ): FormKitConfigSection | null => {
    const currentPath = parentPath ? `${parentPath}.${key}` : key;
    
    // Handle $ref references
    if (property.$ref) {
      const refKey = property.$ref.replace("#/$defs/", "");
      const referencedDef = definitions[refKey];
      if (referencedDef) {
        return parseConfigSection(key, referencedDef as JSONSchemaProperty, definitions, parentPath);
      }
    }

    // Only process object types as sections
    if (property.type !== "object" || !property.properties) {
      return null;
    }

    const title = formatSectionTitle(key);
    const description = property.options?.infoText;

    const children: FormKitSchemaNode[] = [];

    // Add section header
    children.push({
      $el: "div",
      attrs: {
        class: "config-section-header mb-4",
      },
      children: [
        {
          $el: "h3",
          attrs: {
            class: "text-lg font-semibold text-base-content mb-1",
          },
          children: title,
        },
        ...(description
          ? [
              {
                $el: "p",
                attrs: {
                  class: "text-sm text-base-content/70",
                },
                children: description,
              },
            ]
          : []),
      ],
    });

    // Add fields for this section
    for (const [fieldKey, fieldProp] of Object.entries(property.properties)) {
      const fieldPath = `${currentPath}.${fieldKey}`;
      const fieldSchema = parseFieldToFormKit(fieldKey, fieldProp, definitions, fieldPath);
      
      if (fieldSchema) {
        // Store field definition for reference
        fieldDefinitions.value[fieldPath] = {
          type: getFormKitFieldType(fieldProp),
          name: fieldPath,
          label: formatFieldLabel(fieldKey),
          help: fieldProp.options?.infoText,
        };

        children.push(fieldSchema);
      }
    }

    return {
      $el: "div",
      attrs: {
        class: "config-section bg-base-100 border border-base-300 rounded-lg p-6 mb-6",
        "data-section": key,
      },
      meta: {
        title,
        description,
        collapsible: true,
        collapsed: false,
      },
      children,
    };
  };

  const parseFieldToFormKit = (
    key: string,
    property: JSONSchemaProperty,
    definitions: Record<string, JSONSchemaDef>,
    fieldPath: string
  ): FormKitSchemaNode | null => {
    // Handle $ref references
    if (property.$ref) {
      const refKey = property.$ref.replace("#/$defs/", "");
      const referencedDef = definitions[refKey];
      if (referencedDef) {
        return parseFieldToFormKit(key, referencedDef as JSONSchemaProperty, definitions, fieldPath);
      }
    }

    const fieldType = getFormKitFieldType(property);
    const label = formatFieldLabel(key);
    const help = property.options?.infoText;

    // Create wrapper with enable/disable checkbox
    return {
      $el: "div",
      attrs: {
        class: "config-field-wrapper mb-4",
        "data-field": fieldPath,
      },
      children: [
        // Enable/disable checkbox
        {
          $cmp: "FormKit",
          props: {
            type: "checkbox",
            name: `${fieldPath}_enabled`,
            label: label,
            help: help,
            outerClass: "config-field-toggle mb-2",
            decoratorIcon: "toggleOff",
          },
        },
        // Actual field input (conditionally enabled)
        {
          $cmp: "FormKit",
          props: {
            type: fieldType,
            name: fieldPath,
            placeholder: getFieldPlaceholder(property, key),
            validation: getFieldValidation(property),
            disabled: `!$get(${fieldPath}_enabled).value`,
            outerClass: `config-field-input ${fieldType === "textarea" ? "h-32" : ""}`,
            inputClass: buildInputClasses(fieldType),
            labelClass: "sr-only", // Hide label since checkbox shows it
            ...getFieldTypeSpecificProps(property),
          },
          if: `$get(${fieldPath}_enabled).value`,
        },
      ],
    };
  };

  const getFormKitFieldType = (property: JSONSchemaProperty): string => {
    if (property.pattern === "1 fil/0.03 fil/0.31/1 attofil") {
      return "fil-amount";
    }
    if (property.pattern === "0h0m0s") {
      return "duration";
    }
    if (property.type === "array" && property.items?.type === "string") {
      return "address-list";
    }
    if (property.type === "boolean") {
      return "checkbox";
    }
    if (property.type === "integer") {
      return "number";
    }
    if (property.type === "array") {
      return "list";
    }
    if (property.type === "object") {
      return "group";
    }
    return "text";
  };

  const getFieldValidation = (property: JSONSchemaProperty): string => {
    const rules: string[] = [];

    if (property.pattern) {
      if (property.pattern === "1 fil/0.03 fil/0.31/1 attofil") {
        rules.push("fil_amount");
      } else if (property.pattern === "0h0m0s") {
        rules.push("duration");
      } else {
        rules.push(`matches:/${property.pattern}/`);
      }
    }

    if (property.type === "integer") {
      rules.push("number");
    }

    return rules.join("|");
  };

  const getFieldPlaceholder = (property: JSONSchemaProperty, key: string): string => {
    if (property.pattern === "1 fil/0.03 fil/0.31/1 attofil") {
      return "e.g., 5 FIL or 1000000 attofil";
    }
    if (property.pattern === "0h0m0s") {
      return "e.g., 1h30m0s";
    }
    if (property.type === "array" && property.items?.type === "string") {
      return "Enter addresses, one per line";
    }
    if (property.type === "integer") {
      return "Enter a number";
    }
    
    return `Enter ${formatFieldLabel(key).toLowerCase()}`;
  };

  const getFieldTypeSpecificProps = (property: JSONSchemaProperty): Record<string, any> => {
    const props: Record<string, any> = {};

    if (property.type === "array" && property.items?.type === "string") {
      props.rows = 3;
      props.type = "textarea";
    }

    if (property.type === "integer") {
      props.step = 1;
      props.min = 0;
    }

    return props;
  };

  const buildInputClasses = (fieldType: string): string => {
    const baseClasses = [
      "input",
      "input-bordered",
      "w-full",
      "bg-base-100",
      "text-base-content",
      "placeholder-base-content/50",
      "border-base-300",
      "focus:border-primary",
      "focus:outline-none",
      "focus:ring-2",
      "focus:ring-primary/20",
    ];

    if (fieldType === "textarea") {
      baseClasses.push("textarea", "textarea-bordered", "resize-y");
    }

    if (fieldType === "number") {
      baseClasses.push("input-sm");
    }

    return baseClasses.join(" ");
  };

  const formatSectionTitle = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatFieldLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Computed properties
  const formKitSchema = computed(() => {
    if (!schema.value) return [];
    return parseJsonSchemaToFormKit(schema.value);
  });

  const sectionNames = computed(() => {
    return formKitSchema.value.map((section) => section.meta?.title || "");
  });

  const getFieldsBySection = (sectionName: string) => {
    const section = formKitSchema.value.find(s => s.meta?.title === sectionName);
    return section?.children?.filter(child => 
      typeof child === "object" && 
      child.attrs && 
      child.attrs["data-field"]
    ) || [];
  };

  return {
    formKitSchema,
    parsedSections,
    fieldDefinitions,
    sectionNames,
    getFieldsBySection,
    parseJsonSchemaToFormKit,
  };
}