<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
} from "reka-ui";
import { useRouter } from "vue-router";
import { MagnifyingGlassIcon } from "@heroicons/vue/24/outline";
import { navigationEntries, type NavigationEntry } from "@/layouts/navigation";

interface Props {
  open: boolean;
}

interface Emits {
  (e: "update:open", value: boolean): void;
}

interface QuickSearchItem extends NavigationEntry {
  id: string;
  category: string;
  description?: string;
}

const descriptions: Record<string, string> = {
  Overview: "Cluster status and health overview",
  Tasks: "Monitor active, history, and pipeline task states",
  Machines: "Inspect worker performance and assignments",
  Sectors: "Review sector lifecycle details",
  Pipeline: "Track PoRep pipeline progress",
  Market: "Monitor deals and market activity",
  Actor: "Inspect miner actor state",
  Wallets: "Manage wallet balances and addresses",
  IPNI: "Lookup indexed content",
  PDP: "Review proof of data possession",
  Configurations: "Edit layered configuration TOML",
  "Tasks · Overview": "Summaries grouped by task type",
  "Tasks · History": "Completed tasks and outcomes",
  "Tasks · Active": "Live tasks with progress indicators",
  "Tasks · Failures": "Failed tasks for triage",
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const router = useRouter();
const searchTerm = ref("");
const highlightedIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const hintIndex = ref(0);

const hints = [
  "Search actors like t01234 or f01234",
  "Jump to machines, tasks, or pipelines",
  "Open configurations, wallets, or markets",
];

const placeholderText = computed(() =>
  searchTerm.value
    ? "Filter by page name, keyword, or actor ID"
    : hints[hintIndex.value % hints.length],
);

const taskIcon =
  navigationEntries.find((item) => item.label === "Tasks")?.icon ??
  navigationEntries[0]?.icon ??
  MagnifyingGlassIcon;
const actorIcon =
  navigationEntries.find((item) => item.label === "Actor")?.icon ??
  navigationEntries[0]?.icon ??
  MagnifyingGlassIcon;

const baseItems: QuickSearchItem[] = (() => {
  const navigationItems: QuickSearchItem[] = navigationEntries.map(
    (entry): QuickSearchItem => ({
      ...entry,
      id: `nav-${entry.to}`,
      category: "Navigation",
      description: descriptions[entry.label] ?? "",
    }),
  );

  const extraTaskItems: QuickSearchItem[] = [
    {
      id: "task-overview",
      label: "Tasks · Overview",
      icon: taskIcon,
      to: "/tasks/overview",
      category: "Tasks",
      keywords: ["task overview", "pipeline", "task types"],
      description: descriptions["Tasks · Overview"],
    },
    {
      id: "task-active",
      label: "Tasks · Active",
      icon: taskIcon,
      to: "/tasks/active",
      category: "Tasks",
      keywords: ["tasks active", "running", "pc1", "pc2"],
      description: descriptions["Tasks · Active"],
    },
    {
      id: "task-history",
      label: "Tasks · History",
      icon: taskIcon,
      to: "/tasks/history",
      category: "Tasks",
      keywords: ["tasks history", "completed", "archive"],
      description: descriptions["Tasks · History"],
    },
    {
      id: "task-failures",
      label: "Tasks · Failures",
      icon: taskIcon,
      to: "/tasks/history?status=failed",
      category: "Tasks",
      keywords: ["task failures", "failed", "errors"],
      description: descriptions["Tasks · Failures"],
    },
  ];

  const items = [...navigationItems, ...extraTaskItems];
  return items.sort((a, b) => {
    if (a.category === b.category) {
      return a.label.localeCompare(b.label);
    }
    return a.category.localeCompare(b.category);
  });
})();

const actorPattern = /^([tf]0[0-9]+)$/i;

const filteredItems = computed(() => {
  const rawTerm = searchTerm.value.trim();
  const term = rawTerm.toLowerCase();

  const matchesTerm = (item: QuickSearchItem) => {
    const sources: string[] = [
      item.label,
      item.description ?? "",
      item.category,
      ...(item.keywords ?? []),
    ];
    return sources.some((source) => source.toLowerCase().includes(term));
  };

  const suggestions: QuickSearchItem[] = [];

  if (actorPattern.test(term)) {
    const normalized = term;
    const displayId = rawTerm.toUpperCase();
    suggestions.push({
      id: `actor-${normalized}`,
      label: `Actor ${displayId}`,
      icon: actorIcon,
      to: `/actor/${normalized}`,
      category: "Actors",
      keywords: [normalized, "actor", "storage provider"],
      description: `Open storage provider ${displayId}`,
    });
  }

  if (!term) {
    return [...suggestions, ...baseItems.slice(0, 20)].slice(0, 20);
  }

  const matchedEntries = baseItems.filter(matchesTerm);
  return [...suggestions, ...matchedEntries].slice(0, 20);
});

const displayItems = computed(() => {
  const result: Array<
    QuickSearchItem & { index: number; isFirstInCategory: boolean }
  > = [];
  let currentCategory = "";

  filteredItems.value.forEach((item, index) => {
    const isFirstInCategory = item.category !== currentCategory;
    if (isFirstInCategory) {
      currentCategory = item.category;
    }
    result.push({
      ...item,
      index,
      isFirstInCategory,
    });
  });

  return result;
});

const close = () => {
  emit("update:open", false);
};

const selectItem = (item: QuickSearchItem) => {
  router.push(item.to);
  close();
};

const ensureHighlightBounds = () => {
  if (!filteredItems.value.length) {
    highlightedIndex.value = -1;
    return;
  }

  if (
    highlightedIndex.value < 0 ||
    highlightedIndex.value >= filteredItems.value.length
  ) {
    highlightedIndex.value = 0;
  }
};

watch(
  () => props.open,
  async (value) => {
    if (value) {
      hintIndex.value = (hintIndex.value + 1) % hints.length;
      searchTerm.value = "";
      highlightedIndex.value = 0;
      await nextTick();
      inputRef.value?.focus();
    }
  },
);

watch(filteredItems, () => {
  ensureHighlightBounds();
});

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (filteredItems.value.length) {
      highlightedIndex.value =
        (highlightedIndex.value + 1) % filteredItems.value.length;
    }
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (filteredItems.value.length) {
      highlightedIndex.value =
        (highlightedIndex.value - 1 + filteredItems.value.length) %
        filteredItems.value.length;
    }
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    const item = filteredItems.value[highlightedIndex.value];
    if (item) {
      selectItem(item);
    }
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    close();
  }
};

const handleDialogUpdate = (value: boolean) => {
  if (!value) {
    close();
  }
};

const highlightFromIndex = (index: number) => {
  highlightedIndex.value = index;
};

const highlightedId = computed(() => {
  const item = filteredItems.value[highlightedIndex.value];
  return item?.id ?? "";
});
</script>

<template>
  <DialogRoot :open="open" modal @update:open="handleDialogUpdate">
    <DialogPortal>
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <DialogOverlay
          v-if="open"
          force-mount
          class="bg-base-300/60 fixed inset-0 z-40 backdrop-blur-sm"
        />
      </Transition>

      <div
        class="pointer-events-none fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-24"
      >
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-3 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 -translate-y-2 scale-95"
        >
          <DialogContent
            v-if="open"
            force-mount
            class="border-base-300 bg-base-100 pointer-events-auto w-full max-w-2xl rounded-xl border shadow-2xl"
          >
            <div class="border-base-300 border-b px-4 py-3">
              <div class="flex items-center gap-3">
                <MagnifyingGlassIcon
                  class="text-base-content/50 size-5 shrink-0"
                />
                <input
                  ref="inputRef"
                  v-model="searchTerm"
                  type="text"
                  :placeholder="placeholderText"
                  class="placeholder:text-base-content/50 flex-1 bg-transparent text-sm outline-none"
                  @keydown="handleKeydown"
                />
                <span class="text-base-content/50 text-xs uppercase">Esc</span>
              </div>
            </div>

            <div
              class="max-h-[380px] overflow-y-auto px-2 py-2"
              role="listbox"
              :aria-activedescendant="highlightedId"
            >
              <template v-if="displayItems.length">
                <template v-for="item in displayItems" :key="item.id">
                  <p
                    v-if="item.isFirstInCategory"
                    class="text-base-content/50 px-2 pt-3 pb-1 text-xs font-semibold uppercase"
                  >
                    {{ item.category }}
                  </p>
                  <button
                    :id="item.id"
                    type="button"
                    class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition"
                    :class="
                      item.index === highlightedIndex
                        ? 'bg-primary/10 text-primary'
                        : 'text-base-content/80 hover:bg-base-200/70'
                    "
                    @mouseenter="highlightFromIndex(item.index)"
                    @mousedown.prevent="selectItem(item)"
                  >
                    <component
                      :is="item.icon"
                      class="size-5 shrink-0"
                    ></component>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm leading-snug font-medium">
                        {{ item.label }}
                      </p>
                      <p
                        v-if="item.description"
                        class="text-base-content/60 text-xs leading-snug"
                      >
                        {{ item.description }}
                      </p>
                    </div>
                    <span class="text-base-content/50 text-xs">{{
                      item.to
                    }}</span>
                  </button>
                </template>
              </template>
              <div
                v-else
                class="text-base-content/60 flex items-center justify-center py-12 text-sm"
              >
                No destinations found. Try a different keyword.
              </div>
            </div>
          </DialogContent>
        </Transition>
      </div>
    </DialogPortal>
  </DialogRoot>
</template>
