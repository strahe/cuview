<template>
  <div class="config-section">
    <div 
      class="config-section-card border border-base-300 rounded-lg shadow-sm overflow-hidden transition-all duration-200"
      :class="{
        'bg-base-100': !section.collapsed,
        'bg-base-50': section.collapsed,
      }"
    >
      <!-- Section header -->
      <div 
        class="config-section-header p-4 cursor-pointer hover:bg-base-200/50 transition-colors"
        :class="{
          'border-b border-base-300': !section.collapsed,
        }"
        @click="$emit('toggleSection', sectionKey)"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <!-- Collapse/expand icon -->
              <div class="transition-transform duration-200" :class="{ 'rotate-90': !section.collapsed }">
                <svg class="w-4 h-4 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              <!-- Section title -->
              <h3 class="text-lg font-semibold text-base-content">
                {{ section.title }}
              </h3>
              
              <!-- Enabled fields count -->
              <span class="badge badge-sm" :class="enabledFieldsBadgeClass">
                {{ enabledFieldsCount }}/{{ totalFieldsCount }}
              </span>
            </div>
            
            <!-- Section description -->
            <p v-if="section.description" class="text-sm text-base-content/70 mt-1 ml-7">
              {{ section.description }}
            </p>
          </div>
          
          <!-- Section actions -->
          <div class="flex items-center gap-2" @click.stop>
            <button
              type="button"
              class="btn btn-ghost btn-xs"
              :disabled="enabledFieldsCount === totalFieldsCount"
              @click="enableAllFields"
            >
              Enable All
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs"
              :disabled="enabledFieldsCount === 0"
              @click="disableAllFields"
            >
              Disable All
            </button>
          </div>
        </div>
      </div>
      
      <!-- Section content -->
      <div 
        v-if="!section.collapsed"
        class="config-section-content"
        :class="{ 'p-4': !compactMode, 'p-2': compactMode }"
      >
        <div 
          class="grid gap-4"
          :class="{
            'grid-cols-1': compactMode,
            'grid-cols-1 lg:grid-cols-2': !compactMode && totalFieldsCount > 3,
            'grid-cols-1': !compactMode && totalFieldsCount <= 3,
          }"
        >
          <ConfigField
            v-for="[fieldKey, field] in visibleFields"
            :key="fieldKey"
            :field-key="fieldKey"
            :field="field"
            :form-data="formData"
            :compact-mode="compactMode"
            :show-advanced="showAdvanced"
            @update-field="$emit('updateField', $event.path, $event.value)"
            @toggle-field="$emit('toggleField', sectionKey, fieldKey)"
          />
        </div>
        
        <!-- No visible fields message -->
        <div v-if="visibleFields.length === 0" class="text-center py-8 text-base-content/50">
          <div class="text-2xl mb-2">📋</div>
          <p class="text-sm">No fields match current filters</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ConfigField from "./ConfigField.vue";
import type { ConfigSectionState } from "@/types/config";

interface Props {
  sectionKey: string;
  section: ConfigSectionState;
  formData: Record<string, any>;
  compactMode?: boolean;
  showAdvanced?: boolean;
}

interface Emits {
  toggleSection: [sectionKey: string];
  toggleField: [sectionKey: string, fieldKey: string];
  updateField: [path: string, value: any];
}

const props = withDefaults(defineProps<Props>(), {
  compactMode: false,
  showAdvanced: false,
});

const emit = defineEmits<{
  toggleSection: [sectionKey: string];
  toggleField: [sectionKey: string, fieldKey: string];
  updateField: [event: { path: string; value: any }];
}>();

// Computed properties
const visibleFields = computed(() => {
  const fields = Object.entries(props.section.fields);
  
  // Filter advanced fields if not showing advanced
  if (!props.showAdvanced) {
    return fields.filter(([, field]) => {
      // Consider fields with certain types as advanced
      const advancedTypes = ['array', 'object', 'address-list'];
      return !advancedTypes.includes(field.type);
    });
  }
  
  return fields;
});

const enabledFieldsCount = computed(() => {
  return Object.values(props.section.fields).filter(field => field.enabled).length;
});

const totalFieldsCount = computed(() => {
  return Object.keys(props.section.fields).length;
});

const enabledFieldsBadgeClass = computed(() => {
  const ratio = enabledFieldsCount.value / totalFieldsCount.value;
  
  if (ratio === 0) {
    return "badge-ghost";
  } else if (ratio < 0.5) {
    return "badge-warning";
  } else if (ratio < 1) {
    return "badge-info";
  } else {
    return "badge-success";
  }
});

// Event handlers
const enableAllFields = () => {
  for (const fieldKey of Object.keys(props.section.fields)) {
    const field = props.section.fields[fieldKey];
    if (!field.enabled) {
      emit("toggleField", props.sectionKey, fieldKey);
    }
  }
};

const disableAllFields = () => {
  for (const fieldKey of Object.keys(props.section.fields)) {
    const field = props.section.fields[fieldKey];
    if (field.enabled) {
      emit("toggleField", props.sectionKey, fieldKey);
    }
  }
};
</script>

<style scoped>
.config-section {
  @apply w-full;
}

.config-section-header:hover {
  @apply bg-base-200/30;
}

.config-section-content {
  @apply bg-base-100;
}

/* Smooth expand/collapse animation */
.config-section-card {
  transition: all 0.2s ease-in-out;
}

/* Grid responsive adjustments */
@media (max-width: 1024px) {
  .grid-cols-1.lg\:grid-cols-2 {
    @apply grid-cols-1;
  }
}
</style>