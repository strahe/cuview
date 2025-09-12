import { ref, computed, watch, reactive, type Ref } from "vue";
import type {
  ConfigEditorState,
  ConfigFieldState,
  ConfigValidationError,
  ConfigEditorUIState,
} from "@/types/config";
import type { ConfigLayer, JSONSchema } from "@/types/api";
import { useConfigLayers } from "./useConfigLayers";

export function useConfigEditor(layerName: Ref<string>) {
  const { updateLayer } = useConfigLayers();
  
  const formData = ref<Record<string, any>>({});
  const originalData = ref<ConfigLayer>({});
  const editorState = reactive<ConfigEditorState>({
    layerName: "",
    sections: {},
    isDirty: false,
    isValid: true,
    errors: {},
  });
  
  const uiState = reactive<ConfigEditorUIState>({
    searchQuery: "",
    showOnlyEnabled: false,
    showAdvanced: false,
    previewMode: false,
    compactMode: false,
  });

  const validationErrors = ref<ConfigValidationError[]>([]);
  const saving = ref(false);
  const saveError = ref<Error | null>(null);

  // Initialize form state from config layer
  const initializeForm = (layerData: ConfigLayer, schema: JSONSchema | null) => {
    originalData.value = structuredClone(layerData);
    formData.value = {};
    editorState.sections = {};
    
    if (!schema || !schema.$defs?.CurioConfig?.properties) {
      return;
    }

    editorState.layerName = layerName.value;
    
    // Initialize sections and fields based on schema
    for (const [sectionKey, sectionProp] of Object.entries(schema.$defs.CurioConfig.properties)) {
      const sectionPath = sectionKey;
      const sectionData = layerData[sectionKey] as Record<string, any> || {};
      
      editorState.sections[sectionPath] = {
        name: sectionKey,
        title: formatSectionTitle(sectionKey),
        description: (sectionProp as any)?.options?.infoText,
        collapsed: false,
        fields: {},
      };

      // Process section fields
      if ((sectionProp as any)?.type === "object" && (sectionProp as any)?.properties) {
        initializeSection(
          sectionPath,
          (sectionProp as any).properties,
          sectionData,
          schema.$defs
        );
      }
    }
    
    editorState.isDirty = false;
    editorState.isValid = true;
    validateForm();
  };

  const initializeSection = (
    sectionPath: string,
    properties: Record<string, any>,
    sectionData: Record<string, any>,
    definitions: Record<string, any>
  ) => {
    for (const [fieldKey, fieldProp] of Object.entries(properties)) {
      const fieldPath = `${sectionPath}.${fieldKey}`;
      const currentValue = getNestedValue(sectionData, fieldKey);
      const hasValue = currentValue !== undefined && currentValue !== null;
      
      // Initialize field state
      editorState.sections[sectionPath].fields[fieldKey] = {
        enabled: hasValue,
        value: hasValue ? currentValue : getDefaultValue(fieldProp),
        path: fieldPath,
        label: formatFieldLabel(fieldKey),
        type: getFieldType(fieldProp),
        required: false, // Could be derived from schema
        description: fieldProp?.options?.infoText,
      };
      
      // Initialize form data
      formData.value[`${fieldPath}_enabled`] = hasValue;
      formData.value[fieldPath] = hasValue ? currentValue : getDefaultValue(fieldProp);
    }
  };

  // Watch form data changes
  watch(
    formData,
    (newData) => {
      updateFieldStates(newData);
      validateForm();
      checkDirtyState();
    },
    { deep: true }
  );

  const updateFieldStates = (data: Record<string, any>) => {
    for (const [key, value] of Object.entries(data)) {
      if (key.endsWith("_enabled")) {
        const fieldPath = key.replace("_enabled", "");
        const [sectionKey, fieldKey] = fieldPath.split(".", 2);
        
        if (editorState.sections[sectionKey]?.fields[fieldKey]) {
          editorState.sections[sectionKey].fields[fieldKey].enabled = value;
        }
      } else {
        const [sectionKey, fieldKey] = key.split(".", 2);
        
        if (editorState.sections[sectionKey]?.fields[fieldKey]) {
          editorState.sections[sectionKey].fields[fieldKey].value = value;
        }
      }
    }
  };

  const checkDirtyState = () => {
    const currentConfig = buildConfigFromFormData();
    editorState.isDirty = !deepEqual(currentConfig, originalData.value);
  };

  const validateForm = async () => {
    validationErrors.value = [];
    editorState.errors = {};
    
    // Validate enabled fields
    for (const [sectionKey, section] of Object.entries(editorState.sections)) {
      for (const [fieldKey, field] of Object.entries(section.fields)) {
        if (field.enabled) {
          const errors = validateField(field);
          if (errors.length > 0) {
            const fieldPath = `${sectionKey}.${fieldKey}`;
            editorState.errors[fieldPath] = errors.map(e => e.message);
            validationErrors.value.push(...errors);
          }
        }
      }
    }
    
    editorState.isValid = validationErrors.value.length === 0;
  };

  const validateField = (field: ConfigFieldState): ConfigValidationError[] => {
    const errors: ConfigValidationError[] = [];
    
    if (field.required && (!field.value || field.value === "")) {
      errors.push({
        field: field.path,
        message: `${field.label} is required`,
        severity: "error",
      });
    }
    
    // Type-specific validation
    if (field.type === "fil-amount" && field.value) {
      if (!validateFILAmount(field.value)) {
        errors.push({
          field: field.path,
          message: "Invalid FIL amount format. Use formats like '5 FIL' or '1000000 attofil'",
          severity: "error",
        });
      }
    }
    
    if (field.type === "duration" && field.value) {
      if (!validateDuration(field.value)) {
        errors.push({
          field: field.path,
          message: "Invalid duration format. Use format like '1h30m0s'",
          severity: "error",
        });
      }
    }
    
    if (field.type === "integer" && field.value !== null && field.value !== undefined) {
      if (!Number.isInteger(Number(field.value))) {
        errors.push({
          field: field.path,
          message: "Value must be an integer",
          severity: "error",
        });
      }
    }
    
    return errors;
  };

  const validateFILAmount = (value: string): boolean => {
    const filPattern = /^\d+(\.\d+)?\s*(fil|FIL|attofil|ATTOFIL)$/;
    return filPattern.test(value.trim());
  };

  const validateDuration = (value: string): boolean => {
    const durationPattern = /^\d+(h\d+)?(m\d+)?(s\d*)?$/;
    return durationPattern.test(value.trim());
  };

  // Build config object from form data
  const buildConfigFromFormData = (): ConfigLayer => {
    const config: ConfigLayer = {};
    
    for (const [sectionKey, section] of Object.entries(editorState.sections)) {
      const sectionConfig: Record<string, any> = {};
      let hasSectionData = false;
      
      for (const [fieldKey, field] of Object.entries(section.fields)) {
        if (field.enabled && field.value !== undefined && field.value !== null) {
          sectionConfig[fieldKey] = field.value;
          hasSectionData = true;
        }
      }
      
      if (hasSectionData) {
        config[sectionKey] = sectionConfig;
      }
    }
    
    return config;
  };

  // Save config
  const saveConfig = async (comment?: string): Promise<boolean> => {
    if (!editorState.isValid) {
      saveError.value = new Error("Cannot save config with validation errors");
      return false;
    }
    
    saving.value = true;
    saveError.value = null;
    
    try {
      const config = buildConfigFromFormData();
      const success = await updateLayer(layerName.value, config, comment);
      
      if (success) {
        originalData.value = structuredClone(config);
        editorState.isDirty = false;
      }
      
      return success;
    } catch (err) {
      saveError.value = err instanceof Error ? err : new Error("Failed to save config");
      return false;
    } finally {
      saving.value = false;
    }
  };

  // Reset form to original state
  const resetForm = () => {
    initializeForm(originalData.value, null); // Schema not needed for reset
  };

  // Toggle section collapsed state
  const toggleSection = (sectionKey: string) => {
    if (editorState.sections[sectionKey]) {
      editorState.sections[sectionKey].collapsed = !editorState.sections[sectionKey].collapsed;
    }
  };

  // Toggle field enabled state
  const toggleField = (sectionKey: string, fieldKey: string) => {
    const field = editorState.sections[sectionKey]?.fields[fieldKey];
    if (field) {
      field.enabled = !field.enabled;
      formData.value[`${field.path}_enabled`] = field.enabled;
    }
  };

  // Bulk operations
  const enableAllInSection = (sectionKey: string) => {
    const section = editorState.sections[sectionKey];
    if (section) {
      for (const field of Object.values(section.fields)) {
        field.enabled = true;
        formData.value[`${field.path}_enabled`] = true;
      }
    }
  };

  const disableAllInSection = (sectionKey: string) => {
    const section = editorState.sections[sectionKey];
    if (section) {
      for (const field of Object.values(section.fields)) {
        field.enabled = false;
        formData.value[`${field.path}_enabled`] = false;
      }
    }
  };

  // Search and filter
  const filteredSections = computed(() => {
    const sections = Object.entries(editorState.sections);
    
    if (!uiState.searchQuery && !uiState.showOnlyEnabled) {
      return sections;
    }
    
    return sections.filter(([sectionKey, section]) => {
      // Search filter
      if (uiState.searchQuery) {
        const query = uiState.searchQuery.toLowerCase();
        const matchesSection = section.title.toLowerCase().includes(query) ||
                              section.description?.toLowerCase().includes(query);
        
        const matchesField = Object.values(section.fields).some(field =>
          field.label.toLowerCase().includes(query) ||
          field.description?.toLowerCase().includes(query)
        );
        
        if (!matchesSection && !matchesField) {
          return false;
        }
      }
      
      // Show only enabled filter
      if (uiState.showOnlyEnabled) {
        const hasEnabledFields = Object.values(section.fields).some(field => field.enabled);
        if (!hasEnabledFields) {
          return false;
        }
      }
      
      return true;
    });
  });

  // Utility functions
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

  const getFieldType = (prop: any): string => {
    if (prop.pattern === "1 fil/0.03 fil/0.31/1 attofil") return "fil-amount";
    if (prop.pattern === "0h0m0s") return "duration";
    if (prop.type === "array" && prop.items?.type === "string") return "address-list";
    if (prop.type === "boolean") return "boolean";
    if (prop.type === "integer") return "integer";
    if (prop.type === "array") return "array";
    return "string";
  };

  const getDefaultValue = (prop: any): any => {
    if (prop.type === "boolean") return false;
    if (prop.type === "integer") return 0;
    if (prop.type === "array") return [];
    return "";
  };

  const getNestedValue = (obj: any, path: string): any => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  const deepEqual = (obj1: any, obj2: any): boolean => {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  };

  // Computed properties
  const enabledFieldCount = computed(() => {
    return Object.values(editorState.sections).reduce((count, section) => {
      return count + Object.values(section.fields).filter(field => field.enabled).length;
    }, 0);
  });

  const totalFieldCount = computed(() => {
    return Object.values(editorState.sections).reduce((count, section) => {
      return count + Object.keys(section.fields).length;
    }, 0);
  });

  const hasValidationErrors = computed(() => validationErrors.value.length > 0);
  
  const canSave = computed(() => editorState.isDirty && editorState.isValid && !saving.value);

  return {
    // State
    formData,
    editorState,
    uiState,
    validationErrors,
    saving,
    saveError,
    
    // Computed
    filteredSections,
    enabledFieldCount,
    totalFieldCount,
    hasValidationErrors,
    canSave,
    
    // Methods
    initializeForm,
    saveConfig,
    resetForm,
    validateForm,
    toggleSection,
    toggleField,
    enableAllInSection,
    disableAllInSection,
    buildConfigFromFormData,
  };
}