<template>
  <div class="config-tree-node" :style="{ paddingLeft: `${level * 1.5}rem` }">
    <!-- Node header -->
    <div class="flex items-center gap-2 py-1 px-2 rounded hover:bg-base-50 transition-colors">
      <!-- Expand/collapse icon for objects -->
      <button
        v-if="isObject"
        type="button"
        class="w-4 h-4 flex items-center justify-center hover:bg-base-200 rounded transition-colors"
        @click="toggleExpanded"
      >
        <svg
          class="w-3 h-3 transition-transform duration-200"
          :class="{ 'rotate-90': isExpanded }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div v-else class="w-4"></div>
      
      <!-- Node key -->
      <span class="font-mono text-sm font-medium text-primary">{{ nodeKey }}</span>
      
      <!-- Node type indicator -->
      <span class="badge badge-xs" :class="typeBadgeClass">
        {{ nodeType }}
      </span>
      
      <!-- Node value (for primitives) -->
      <span v-if="!isObject" class="text-sm font-mono text-base-content/80">
        {{ formattedValue }}
      </span>
      
      <!-- Array/object count -->
      <span v-else-if="isArray" class="text-xs text-base-content/60">
        [{{ (nodeValue as unknown[]).length }} items]
      </span>
      <span v-else-if="isObject" class="text-xs text-base-content/60">
        {{ `{${Object.keys(nodeValue as Record<string, unknown>).length} properties}` }}
      </span>
    </div>
    
    <!-- Child nodes (for expanded objects/arrays) -->
    <div v-if="isObject && isExpanded">
      <template v-if="isArray">
        <ConfigTreeNode
          v-for="(item, index) in (nodeValue as unknown[])"
          :key="index"
          :node-key="`[${index}]`"
          :node-value="item"
          :level="level + 1"
          :schema="schema"
        />
      </template>
      <template v-else>
        <ConfigTreeNode
          v-for="[key, value] in Object.entries(nodeValue as Record<string, unknown>)"
          :key="key"
          :node-key="key"
          :node-value="value"
          :level="level + 1"
          :schema="schema"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { JSONSchema } from "@/types/api";

interface Props {
  nodeKey: string;
  nodeValue: unknown;
  level: number;
  schema?: JSONSchema;
}

const props = defineProps<Props>();

// State
const isExpanded = ref(props.level < 2); // Auto-expand first 2 levels

// Computed properties
const isObject = computed(() => {
  return typeof props.nodeValue === "object" && 
         props.nodeValue !== null && 
         !Array.isArray(props.nodeValue);
});

const isArray = computed(() => {
  return Array.isArray(props.nodeValue);
});

const nodeType = computed(() => {
  if (props.nodeValue === null) return "null";
  if (props.nodeValue === undefined) return "undefined";
  if (Array.isArray(props.nodeValue)) return "array";
  if (typeof props.nodeValue === "object") return "object";
  if (typeof props.nodeValue === "string") return "string";
  if (typeof props.nodeValue === "number") return "number";
  if (typeof props.nodeValue === "boolean") return "boolean";
  return "unknown";
});

const typeBadgeClass = computed(() => {
  const typeClasses: Record<string, string> = {
    "object": "badge-primary",
    "array": "badge-secondary",
    "string": "badge-ghost",
    "number": "badge-info",
    "boolean": "badge-success",
    "null": "badge-warning",
    "undefined": "badge-error",
  };
  
  return typeClasses[nodeType.value] || "badge-ghost";
});

const formattedValue = computed(() => {
  if (props.nodeValue === null) return "null";
  if (props.nodeValue === undefined) return "undefined";
  if (typeof props.nodeValue === "string") {
    // Truncate long strings
    const str = props.nodeValue.toString();
    return str.length > 50 ? `"${str.substring(0, 47)}..."` : `"${str}"`;
  }
  if (typeof props.nodeValue === "boolean") {
    return props.nodeValue ? "true" : "false";
  }
  if (typeof props.nodeValue === "number") {
    return props.nodeValue.toString();
  }
  return String(props.nodeValue);
});

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};
</script>

<style scoped>
.config-tree-node {
  @apply text-sm;
}

/* Indentation lines for better visual hierarchy */
.config-tree-node::before {
  content: '';
  @apply absolute left-0 top-0 bottom-0 w-px bg-base-300;
  margin-left: calc(v-bind(level) * 1.5rem + 0.5rem);
}

/* Remove line for root level */
.config-tree-node[style*="padding-left: 0rem"]::before {
  @apply hidden;
}
</style>