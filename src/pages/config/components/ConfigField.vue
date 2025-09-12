<template>
  <div class="config-field" :class="{ 'config-field-compact': compactMode }">
    <div 
      class="config-field-wrapper border border-base-300 rounded-lg overflow-hidden transition-all duration-200"
      :class="{
        'bg-base-50 border-base-200': !field.enabled,
        'bg-base-100 border-base-300': field.enabled,
        'ring-2 ring-primary/20': field.enabled && formValue !== undefined,
      }"
    >
      <!-- Field header with enable/disable toggle -->
      <div 
        class="config-field-header p-3 cursor-pointer transition-colors"
        :class="{
          'bg-base-100 border-b border-base-300 hover:bg-base-50': field.enabled,
          'bg-base-50 hover:bg-base-100': !field.enabled,
        }"
        @click="toggleField"
      >
        <div class="flex items-start gap-3">
          <!-- Enable/disable checkbox -->
          <div class="flex items-center pt-0.5">
            <input
              :checked="field.enabled"
              type="checkbox"
              class="checkbox checkbox-sm checkbox-primary"
              @change="toggleField"
              @click.stop
            />
          </div>
          
          <div class="flex-1 min-w-0">
            <!-- Field label -->
            <div class="flex items-center gap-2">
              <label 
                class="font-medium text-base-content cursor-pointer"
                :class="{
                  'text-base-content/50': !field.enabled,
                }"
              >
                {{ field.label }}
              </label>
              
              <!-- Field type badge -->
              <span 
                class="badge badge-xs"
                :class="fieldTypeBadgeClass"
              >
                {{ field.type }}
              </span>
              
              <!-- Required indicator -->
              <span v-if="field.required" class="text-error text-xs">*</span>
            </div>
            
            <!-- Field description -->
            <p 
              v-if="field.description && !compactMode"
              class="text-xs text-base-content/60 mt-1 leading-relaxed"
            >
              {{ field.description }}
            </p>
          </div>
          
          <!-- Field status indicators -->
          <div class="flex items-center gap-1">
            <!-- Has value indicator -->
            <div
              v-if="field.enabled && formValue !== undefined && formValue !== '' && formValue !== null"
              class="w-2 h-2 bg-success rounded-full"
              title="Has value"
            ></div>
            
            <!-- Error indicator -->
            <div
              v-if="hasFieldError"
              class="w-2 h-2 bg-error rounded-full animate-pulse"
              title="Has validation error"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- Field input (shown when enabled) -->
      <div 
        v-if="field.enabled"
        class="config-field-input p-3 bg-base-100"
      >
        <!-- Custom inputs -->
        <FILAmountInput
          v-if="field.type === 'fil-amount'"
          :context="createFieldContext()"
        />
        
        <DurationInput
          v-else-if="field.type === 'duration'"
          :context="createFieldContext()"
        />
        
        <AddressListInput
          v-else-if="field.type === 'address-list'"
          :context="createFieldContext()"
        />
        
        <!-- Standard FormKit inputs -->
        <FormKit
          v-else
          :type="getFormKitType(field.type)"
          :name="field.path"
          :model-value="formValue"
          :label="false"
          :placeholder="getFieldPlaceholder()"
          :validation="field.validation?.join('|')"
          :options="getFieldOptions()"
          :step="field.type === 'integer' ? '1' : undefined"
          :min="field.type === 'integer' ? '0' : undefined"
          outer-class="w-full"
          input-class="input input-bordered w-full bg-base-100 border-base-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
          label-class="label-text font-medium text-base-content"
          help-class="text-xs text-base-content/60 mt-1"
          @input="updateFieldValue"
        />
        
        <!-- Field validation errors -->
        <div v-if="fieldErrors.length > 0" class="mt-2">
          <div 
            v-for="error in fieldErrors" 
            :key="error" 
            class="text-xs text-error"
          >
            {{ error }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { FormKit } from "@formkit/vue";
import FILAmountInput from "./custom-inputs/FILAmountInput.vue";
import DurationInput from "./custom-inputs/DurationInput.vue";
import AddressListInput from "./custom-inputs/AddressListInput.vue";
import type { ConfigFieldState } from "@/types/config";

interface Props {
  fieldKey: string;
  field: ConfigFieldState;
  formData: Record<string, any>;
  compactMode?: boolean;
  showAdvanced?: boolean;
}

interface Emits {
  toggleField: [];
  updateField: [event: { path: string; value: any }];
}

const props = withDefaults(defineProps<Props>(), {
  compactMode: false,
  showAdvanced: false,
});

const emit = defineEmits<{
  toggleField: [];
  updateField: [event: { path: string; value: any }];
}>();

// Computed properties
const formValue = computed(() => {
  return props.formData[props.field.path];
});

const fieldErrors = computed(() => {
  // This would normally come from the validation system
  return [];
});

const hasFieldError = computed(() => {
  return fieldErrors.value.length > 0;
});

const fieldTypeBadgeClass = computed(() => {
  const typeClasses: Record<string, string> = {
    'string': 'badge-ghost',
    'integer': 'badge-info',
    'boolean': 'badge-success',
    'array': 'badge-warning',
    'fil-amount': 'badge-primary',
    'duration': 'badge-secondary',
    'address-list': 'badge-accent',
  };
  
  return typeClasses[props.field.type] || 'badge-ghost';
});

// Methods
const toggleField = () => {
  emit("toggleField");
};

const updateFieldValue = (value: any) => {
  emit("updateField", { path: props.field.path, value });
};

const getFormKitType = (fieldType: string): string => {
  const typeMap: Record<string, string> = {
    'string': 'text',
    'integer': 'number',
    'boolean': 'checkbox',
    'array': 'textarea',
  };
  
  return typeMap[fieldType] || 'text';
};

const getFieldPlaceholder = (): string => {
  const placeholders: Record<string, string> = {
    'string': `Enter ${props.field.label.toLowerCase()}`,
    'integer': 'Enter a number',
    'boolean': '',
    'array': 'Enter items, one per line',
  };
  
  return placeholders[props.field.type] || `Enter ${props.field.label.toLowerCase()}`;
};

const getFieldOptions = (): Array<{ label: string; value: any }> | undefined => {
  // For specific fields that need options (e.g., select dropdowns)
  return undefined;
};

const createFieldContext = () => {
  // Create a FormKit-compatible context for custom inputs
  return {
    id: `field-${props.field.path}`,
    name: props.field.path,
    value: formValue.value,
    disabled: false,
    placeholder: getFieldPlaceholder(),
    validation: props.field.validation?.join('|'),
    node: {
      input: (value: any) => updateFieldValue(value),
    },
    state: {
      valid: !hasFieldError.value,
      validationVisible: hasFieldError.value,
      validationMessage: fieldErrors.value[0] || '',
    },
  };
};
</script>

<style scoped>
.config-field {
  @apply w-full;
}

.config-field-compact {
  @apply text-sm;
}

.config-field-compact .config-field-header {
  @apply py-2;
}

.config-field-compact .config-field-input {
  @apply py-2;
}

.config-field-wrapper {
  transition: all 0.2s ease-in-out;
}

.config-field-wrapper:hover {
  @apply shadow-md;
}

/* Animation for enable/disable state */
.config-field-input {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>