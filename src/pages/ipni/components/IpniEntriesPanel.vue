<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { LocationQueryRaw } from "vue-router";
import {
  CubeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/vue/24/outline";
import SectionCard from "@/components/ui/SectionCard.vue";
import { useIpniEntryLookup } from "../composables/useIpniEntryLookup";
import CopyButton from "@/components/ui/CopyButton.vue";
import { formatBytes } from "@/utils/format";
import {
  mergeCidQuery,
  normalizeQueryString,
} from "../composables/useIpniQueryParams";

const route = useRoute();
const router = useRouter();

const searchTerm = ref<string>(normalizeQueryString(route.query.entry));

const { entry, loading, error, lastQuery, search } = useIpniEntryLookup();

const canSubmit = computed(() => searchTerm.value.trim().length > 0);
const hasResult = computed(() => Boolean(entry.value));

const rangeLabel = computed(() => {
  if (!entry.value) return "";
  const blocks = entry.value.NumBlocks;
  const size = entry.value.Size > 0 ? formatBytes(entry.value.Size) : "n/a";
  return `${blocks} blocks • ${size}`;
});

const fromCarLabel = computed(() =>
  entry.value?.FromCar ? "CAR" : "Index (HAMT)",
);

const prevCid = computed(() => {
  const value = entry.value?.PrevCID;
  return typeof value === "string" ? value : "";
});

const firstCid = computed(() => {
  const value = entry.value?.FirstCID;
  return typeof value === "string" ? value : "";
});

const handleSearch = () => {
  const nextQuery = mergeCidQuery(
    router.currentRoute.value.query as LocationQueryRaw,
    "entry",
    searchTerm.value,
  );
  router.replace({ query: nextQuery });
};

const handleSubmit = (event: Event) => {
  event.preventDefault();
  if (!canSubmit.value) return;
  handleSearch();
};

const handleLoadPrevious = () => {
  const target = prevCid.value;
  if (!target) return;
  searchTerm.value = target;
  const nextQuery = mergeCidQuery(
    router.currentRoute.value.query as LocationQueryRaw,
    "entry",
    target,
  );
  router.replace({ query: nextQuery });
};

watchEffect(() => {
  const cid = normalizeQueryString(route.query.entry);

  if (cid !== searchTerm.value) {
    searchTerm.value = cid;
  }

  if (!cid) {
    search("");
    return;
  }

  if (cid === lastQuery.value) {
    return;
  }

  search(cid);
});
</script>

<template>
  <SectionCard
    title="Entry Explorer"
    :icon="CubeIcon"
    tooltip="Inspect individual entry chunks within an advertisement"
  >
    <form class="space-y-3" @submit="handleSubmit">
      <label class="text-base-content text-sm font-medium">Entry CID</label>
      <div class="join w-full">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="bafy..."
          class="input join-item input-bordered w-full"
          :disabled="loading"
        />
        <button
          type="submit"
          class="btn join-item btn-primary"
          :disabled="loading || !canSubmit"
        >
          <ArrowPathIcon v-if="loading" class="size-4 animate-spin" />
          <CubeIcon v-else class="size-4" />
          <span>Lookup</span>
        </button>
      </div>
      <p class="text-base-content/60 text-xs">
        Provide a block CID to retrieve its entry metadata, including the linked
        chunk in the advertisement chain.
      </p>
    </form>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="error" class="alert alert-error mt-6">
      <ExclamationTriangleIcon class="size-5" />
      <span>{{ error.message }}</span>
    </div>

    <div
      v-else-if="!hasResult"
      class="text-base-content/60 border-base-300 bg-base-200/40 mt-6 rounded-lg border border-dashed p-6 text-sm"
    >
      Enter an entry CID or open one from the advertisements panel to start
      inspecting chunk metadata.
    </div>

    <template v-else>
      <div class="mt-6 space-y-4">
        <div class="bg-base-200/40 rounded-lg p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="space-y-1">
              <h3 class="text-lg font-semibold">{{ entry?.PieceCID }}</h3>
              <p class="text-base-content/60 text-xs">
                {{ fromCarLabel }} • {{ rangeLabel }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <CopyButton
                :value="entry?.PieceCID || ''"
                label="Copy Piece CID"
                size="sm"
                variant="ghost"
                aria-label="Copy piece CID"
                :disabled="!entry?.PieceCID"
              />
              <button
                class="btn btn-outline btn-sm"
                type="button"
                :disabled="!entry?.PrevCID"
                @click="handleLoadPrevious"
              >
                <ArrowUturnLeftIcon class="size-4" />
                Previous chunk
              </button>
            </div>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="border-base-300 rounded-lg border p-4">
            <h4
              class="text-base-content/70 text-sm font-semibold tracking-wide uppercase"
            >
              Entry Details
            </h4>
            <dl class="mt-3 space-y-2 text-sm">
              <div class="flex items-start justify-between gap-3">
                <dt class="text-base-content/70">Entry CID</dt>
                <dd class="font-mono text-xs">{{ lastQuery }}</dd>
              </div>
              <div class="flex items-start justify-between gap-3">
                <dt class="text-base-content/70">First CID</dt>
                <dd class="font-mono text-xs">{{ firstCid || "—" }}</dd>
              </div>
              <div class="flex items-start justify-between gap-3">
                <dt class="text-base-content/70">Previous CID</dt>
                <dd class="font-mono text-xs">{{ prevCid || "—" }}</dd>
              </div>
              <div class="flex items-start justify-between gap-3">
                <dt class="text-base-content/70">Start Offset</dt>
                <dd class="font-medium">
                  {{ entry?.StartOffset ?? "—" }}
                </dd>
              </div>
              <div class="flex items-start justify-between gap-3">
                <dt class="text-base-content/70">Blocks</dt>
                <dd class="font-medium">{{ entry?.NumBlocks }}</dd>
              </div>
              <div v-if="entry?.Err" class="text-error flex items-start gap-2">
                <ExclamationTriangleIcon class="size-4" />
                <span class="text-xs">{{ entry?.Err }}</span>
              </div>
            </dl>
          </div>

          <div class="border-base-300 rounded-lg border p-4">
            <h4
              class="text-base-content/70 text-sm font-semibold tracking-wide uppercase"
            >
              Copy Helpers
            </h4>
            <div class="mt-3 space-y-2 text-sm">
              <CopyButton
                :value="entry?.PieceCID || ''"
                label="Copy Piece CID"
                variant="outline"
                size="sm"
                extra-class="w-full justify-between"
                :disabled="!entry?.PieceCID"
              />
              <CopyButton
                :value="lastQuery || ''"
                label="Copy Entry CID"
                variant="outline"
                size="sm"
                extra-class="w-full justify-between"
                :disabled="!lastQuery"
              />
              <CopyButton
                :value="prevCid || ''"
                label="Copy Previous CID"
                variant="outline"
                size="sm"
                extra-class="w-full justify-between"
                :disabled="!prevCid"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </SectionCard>
</template>
