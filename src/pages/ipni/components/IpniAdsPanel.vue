<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { formatDistanceToNow } from "date-fns";
import { useRoute, useRouter } from "vue-router";
import type { LocationQueryRaw } from "vue-router";
import {
  DocumentMagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChartBarIcon,
  ListBulletIcon,
} from "@heroicons/vue/24/outline";
import SectionCard from "@/components/ui/SectionCard.vue";
import KPICard from "@/components/ui/KPICard.vue";
import CopyButton from "@/components/ui/CopyButton.vue";
import IpniAdsTable from "./IpniAdsTable.vue";
import { useIpniAdSearch } from "../composables/useIpniAdSearch";
import { useIpniAdsList } from "../composables/useIpniAdsList";
import {
  mergeCidQuery,
  normalizeQueryString,
} from "../composables/useIpniQueryParams";
import { useCurioQuery } from "@/composables/useCurioQuery";
import { formatBytes } from "@/utils/format";
import type { IpniAdRow } from "@/types/ipni";

const route = useRoute();
const router = useRouter();

const searchTerm = ref<string>(normalizeQueryString(route.query.ad));

const {
  ad,
  loading: searchLoading,
  error: searchError,
  hasResult,
  lastQuery,
  skipMutationPending,
  skipMutationError,
  search,
  toggleSkip,
} = useIpniAdSearch();

const {
  ads,
  failures,
  loading: listLoading,
  error: listError,
  lastUpdated: listLastUpdated,
  refresh: refreshAds,
  stats: adsStats,
} = useIpniAdsList();

const { call } = useCurioQuery();

const addresses = computed(() => {
  if (!ad.value?.addresses) return [] as string[];
  return ad.value.addresses
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
});

const adCids = computed(() => ad.value?.ad_cids ?? []);
const alternativeCids = computed(() =>
  adCids.value.filter((cid) => cid !== ad.value?.ad_cid),
);

const skipButtonLabel = computed(() =>
  ad.value?.is_skip ? "Unskip Advertisement" : "Skip Advertisement",
);

const skipButtonVariant = computed(() =>
  ad.value?.is_skip ? "btn-success" : "btn-warning",
);

const canSubmit = computed(() => searchTerm.value.trim().length > 0);

const showResult = computed(() => hasResult.value && !!ad.value);

const pieceSizeLabel = computed(() =>
  ad.value ? formatBytes(ad.value.piece_size) : "0 B",
);

const listLastUpdatedLabel = computed(() => {
  if (!listLastUpdated.value) return "Never";
  return formatDistanceToNow(new Date(listLastUpdated.value), {
    addSuffix: true,
  });
});

const pendingTableAd = ref<string | null>(null);
const tableMutationError = ref<Error | null>(null);

const handleSearch = () => {
  const nextQuery = mergeCidQuery(
    router.currentRoute.value.query as LocationQueryRaw,
    "ad",
    searchTerm.value,
  );
  router.replace({ query: nextQuery });
};

const handleSubmit = async (event: Event) => {
  event.preventDefault();
  if (!canSubmit.value) return;
  await handleSearch();
};

const handleToggleSkip = async () => {
  if (!ad.value) return;
  await toggleSkip(!ad.value.is_skip);
  await refreshAds();
};

const navigateToEntries = () => {
  if (!ad.value?.entries) return;

  const baseQuery = {
    ...router.currentRoute.value.query,
    tab: "entries",
  } as LocationQueryRaw;

  delete baseQuery.ad;

  const nextQuery = mergeCidQuery(baseQuery, "entry", ad.value.entries);

  router.replace({ query: nextQuery });
};

const handleTableView = (row: IpniAdRow) => {
  searchTerm.value = row.ad_cid;
  const nextQuery = mergeCidQuery(
    router.currentRoute.value.query as LocationQueryRaw,
    "ad",
    row.ad_cid,
  );
  router.replace({ query: nextQuery });
};

const handleChainSelect = (cid: string) => {
  if (!cid) return;
  searchTerm.value = cid;
  const nextQuery = mergeCidQuery(
    router.currentRoute.value.query as LocationQueryRaw,
    "ad",
    cid,
  );
  router.replace({ query: nextQuery });
};

const handleTableToggle = async (row: IpniAdRow) => {
  pendingTableAd.value = row.ad_cid;
  tableMutationError.value = null;

  try {
    await call<void>("IPNISetSkip", [{ "/": row.ad_cid }, !row.is_skip]);
    await refreshAds();

    if (ad.value?.ad_cid === row.ad_cid) {
      await search(row.ad_cid);
    }
  } catch (err) {
    tableMutationError.value = err as Error;
  } finally {
    pendingTableAd.value = null;
  }
};

watchEffect(() => {
  const cid = normalizeQueryString(route.query.ad);

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
    title="Advertisement Lookup"
    :icon="DocumentMagnifyingGlassIcon"
    tooltip="Inspect and manage individual IPNI advertisements"
  >
    <form class="space-y-3" @submit="handleSubmit">
      <label class="text-base-content text-sm font-medium">
        Advertisement CID
      </label>
      <div class="join w-full">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="bafy..."
          class="input join-item input-bordered w-full"
          :disabled="searchLoading"
        />
        <button
          type="submit"
          class="btn join-item btn-primary"
          :disabled="searchLoading || !canSubmit"
        >
          <ArrowPathIcon v-if="searchLoading" class="size-4 animate-spin" />
          <DocumentMagnifyingGlassIcon v-else class="size-4" />
          <span>Search</span>
        </button>
      </div>
    </form>

    <div v-if="searchLoading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="searchError" class="alert alert-error mt-6">
      <ExclamationTriangleIcon class="size-5" />
      <span>{{ searchError.message }}</span>
    </div>

    <div
      v-else-if="!showResult"
      class="border-base-300 text-base-content/70 bg-base-200 mt-6 rounded-lg border border-dashed py-6 text-center text-sm"
    >
      Enter a CID to search
    </div>

    <template v-else>
      <div class="mt-6 space-y-6">
        <div class="bg-base-200 border-base-300 rounded-lg border p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold">{{ ad?.ad_cid }}</h3>
              <p class="text-base-content/70 text-xs">
                Miner {{ ad?.miner }} • Piece {{ ad?.piece_cid }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button
                class="btn btn-outline btn-sm"
                :class="skipButtonVariant"
                :disabled="skipMutationPending"
                @click="handleToggleSkip"
              >
                <ArrowPathIcon
                  v-if="skipMutationPending"
                  class="size-4 animate-spin"
                />
                <span v-else>{{ skipButtonLabel }}</span>
              </button>
              <CopyButton
                :value="ad?.ad_cid"
                label="Copy CID"
                variant="ghost"
                size="sm"
                aria-label="Copy advertisement CID"
              />
              <button
                class="btn btn-ghost btn-sm"
                type="button"
                :disabled="!ad?.entries"
                @click="navigateToEntries"
              >
                <ChevronRightIcon class="size-4" />
                Inspect entries
              </button>
            </div>
          </div>

          <div v-if="skipMutationError" class="alert alert-error mt-3 text-sm">
            <ExclamationTriangleIcon class="size-4" />
            <span>{{ skipMutationError.message }}</span>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="border-base-300 rounded-lg border p-4">
            <h4
              class="text-base-content/70 text-sm font-semibold tracking-wide uppercase"
            >
              Advertisement
            </h4>
            <dl class="mt-3 space-y-2 text-sm">
              <div class="flex items-start justify-between gap-3">
                <dt class="text-base-content/70">Is Remove</dt>
                <dd class="font-medium">{{ ad?.is_rm ? "Yes" : "No" }}</dd>
              </div>
              <div class="flex items-start justify-between gap-3">
                <dt class="text-base-content/70">Skip</dt>
                <dd class="font-medium">
                  {{ ad?.is_skip ? "Enabled" : "Disabled" }}
                </dd>
              </div>
              <div class="flex items-start justify-between gap-3">
                <dt class="text-base-content/70">Piece Size</dt>
                <dd class="font-medium">{{ pieceSizeLabel }}</dd>
              </div>
              <div class="flex items-start justify-between gap-3">
                <dt class="text-base-content/70">Entry Count</dt>
                <dd class="font-medium">
                  {{ ad?.entry_count ?? 0 }} entries •
                  {{ ad?.cid_count ?? 0 }} CIDs
                </dd>
              </div>
            </dl>
          </div>

          <div class="border-base-300 rounded-lg border p-4">
            <h4
              class="text-base-content/70 text-sm font-semibold tracking-wide uppercase"
            >
              Links
            </h4>
            <dl class="mt-3 space-y-2 text-sm">
              <div class="flex items-start justify-between gap-3">
                <dt class="text-base-content/70">Entries Head</dt>
                <dd class="flex items-center gap-2">
                  <span class="font-mono text-xs">{{ ad?.entries }}</span>
                  <CopyButton
                    :value="ad?.entries"
                    :icon-only="true"
                    aria-label="Copy entries head"
                    extra-class="btn-ghost"
                  />
                </dd>
              </div>
              <div class="flex items-start justify-between gap-3">
                <dt class="text-base-content/70">Previous</dt>
                <dd class="flex items-center gap-2">
                  <span class="font-mono text-xs">
                    {{ ad?.previous || "—" }}
                  </span>
                  <CopyButton
                    v-if="ad?.previous"
                    :value="ad?.previous || ''"
                    :icon-only="true"
                    aria-label="Copy previous advertisement CID"
                    extra-class="btn-ghost"
                  />
                </dd>
              </div>
              <div class="flex items-start justify-between gap-3">
                <dt class="text-base-content/70">Peer Addresses</dt>
                <dd class="flex flex-col gap-1 font-mono text-xs">
                  <span v-if="!addresses.length" class="text-base-content/50">
                    Not provided
                  </span>
                  <span v-for="addr in addresses" :key="addr">{{ addr }}</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div
          v-if="alternativeCids.length"
          class="border-base-300 rounded-lg border p-4"
        >
          <h4
            class="text-base-content/70 text-sm font-semibold tracking-wide uppercase"
          >
            Additional Advertisement CIDs
          </h4>
          <div class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="cid in alternativeCids"
              :key="cid"
              class="badge badge-outline gap-2"
            >
              <span class="font-mono text-xs">{{ cid }}</span>
              <CopyButton
                :value="cid"
                :icon-only="true"
                aria-label="Copy advertisement CID"
                extra-class="btn-ghost"
              />
              <button
                class="btn btn-link btn-xs"
                type="button"
                @click="handleChainSelect(cid)"
              >
                View
              </button>
            </span>
          </div>
        </div>
      </div>

      <div v-if="showResult" class="alert alert-success mt-6">
        <CheckCircleIcon class="size-5" />
        <span>
          Loaded advertisement {{ ad?.ad_cid }} for miner {{ ad?.miner }}.
        </span>
      </div>
    </template>
  </SectionCard>

  <SectionCard
    class="mt-6"
    title="Active Advertisements"
    :icon="ChartBarIcon"
    tooltip="Provider heads fetched from IPNI summary"
  >
    <template #actions>
      <div class="text-base-content/70 flex items-center gap-3 text-xs">
        <span>Updated {{ listLastUpdatedLabel }}</span>
      </div>
    </template>

    <div class="mb-4 grid gap-4 md:grid-cols-3">
      <KPICard
        label="Tracked Ads"
        :value="adsStats.total"
        :icon="ListBulletIcon"
      />
      <KPICard
        label="Skipped"
        :value="adsStats.skipped"
        :class="adsStats.skipped > 0 ? 'bg-warning/10' : ''"
      />
      <KPICard
        label="Removals"
        :value="adsStats.removals"
        :class="adsStats.removals > 0 ? 'bg-info/10' : ''"
      />
    </div>
    <p class="text-base-content/60 text-xs">
      {{ adsStats.totalEntries }} total entries across tracked advertisements
    </p>

    <div v-if="tableMutationError" class="alert alert-error mb-4">
      <ExclamationTriangleIcon class="size-4" />
      <span>{{ tableMutationError.message }}</span>
    </div>

    <div v-if="failures.length" class="alert alert-warning mb-4">
      <div class="font-semibold">Providers without active advertisements</div>
      <ul class="mt-1 list-disc pl-5 text-sm">
        <li v-for="failure in failures" :key="failure.peerId">
          {{ failure.miner }} ({{ failure.peerId }}) — {{ failure.error }}
        </li>
      </ul>
    </div>
    <div v-if="listLoading && !ads.length" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <IpniAdsTable
      v-else
      :items="ads"
      :loading="listLoading"
      :error="listError || null"
      :on-refresh="refreshAds"
      :pending-ad-cid="pendingTableAd"
      @view="handleTableView"
      @toggle-skip="handleTableToggle"
    />
  </SectionCard>
</template>
