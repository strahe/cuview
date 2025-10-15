<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  UserGroupIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
} from "@heroicons/vue/24/outline";
import DataSection from "@/components/ui/DataSection.vue";
import DataTable from "@/components/ui/DataTable.vue";
import CopyButton from "@/components/ui/CopyButton.vue";
import DeadlineGrid from "@/components/ui/DeadlineGrid.vue";
import DeadlineLegend from "@/components/ui/DeadlineLegend.vue";
import ActorWalletsPanel from "./components/ActorWalletsPanel.vue";
import ActorChartsPanel from "./components/ActorChartsPanel.vue";
import { useActorDetail, useActorCharts } from "./composables/useActorData";
import { usePageTitle } from "@/composables/usePageTitle";
import { formatBytes } from "@/utils/format";
import { formatEpochRelative } from "@/utils/filecoin";

const route = useRoute("/actor/[id]");
const router = useRouter();
const actorId = route.params.id;

const { actorDetail, loading, error, refresh } = useActorDetail(actorId);

const {
  sectorBuckets,
  loading: chartsLoading,
  error: chartsError,
} = useActorCharts(actorId);

const { updateTitle } = usePageTitle();
const dynamicTitle = computed(() => {
  if (loading.value && !actorDetail.value) return "Loading...";
  if (error.value && !actorDetail.value) return "Error";
  if (actorDetail.value) {
    return `${actorDetail.value.Summary.Address}`;
  }
  return `Actor ${actorId}`;
});

updateTitle(dynamicTitle);

const hasData = computed(() => Boolean(actorDetail.value));

const currentEpoch = computed(() => {
  if (!sectorBuckets.value) return 0;
  const firstAll = sectorBuckets.value.All[0]?.BucketEpoch ?? Infinity;
  const firstCC = sectorBuckets.value.CC[0]?.BucketEpoch ?? Infinity;
  return Math.min(firstAll, firstCC);
});

const formatEpochToDate = (epoch: number) => {
  return formatEpochRelative(epoch, currentEpoch.value);
};

const parseNumericValue = (value: string | number | null | undefined) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const parsed = Number.parseFloat(value.toString());
  return Number.isNaN(parsed) ? 0 : parsed;
};

const beneficiaryUsage = computed(() => {
  const term = actorDetail.value?.BeneficiaryTerm;
  if (!term) return null;

  const quota = parseNumericValue(term.Quota);
  const used = parseNumericValue(term.UsedQuota);

  if (quota <= 0 || Number.isNaN(quota)) return null;
  if (used < 0 || Number.isNaN(used)) return 0;

  const percentage = Math.round((used / quota) * 100);
  return Math.min(Math.max(percentage, 0), 100);
});

const goBack = () => router.back();
</script>

<route>
{
  "meta": {
    "title": "Actor Detail"
  }
}
</route>

<template>
  <DataSection
    :loading="loading"
    :error="error"
    :has-data="hasData"
    :on-retry="refresh"
    error-title="Actor Data Error"
    :empty-icon="UserGroupIcon"
    empty-message="Actor not found"
  >
    <template #loading>Loading actor details...</template>

    <div v-if="actorDetail" class="p-6">
      <div class="mb-6">
        <button class="btn btn-outline btn-sm gap-2" @click="goBack">
          <ArrowLeftIcon class="h-4 w-4" />
          Back
        </button>
      </div>

      <header class="mb-8">
        <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="text-3xl leading-tight font-bold break-all">
                {{ actorDetail.Summary.Address }}
              </h1>
              <CopyButton
                :value="actorDetail.Summary.Address"
                :aria-label="`Copy actor address ${actorDetail.Summary.Address}`"
                size="sm"
                :icon-only="true"
              />
            </div>

            <div class="border-base-200 border-t pt-3">
              <div
                class="text-base-content/70 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
              >
                <div class="flex items-center gap-2">
                  <span class="text-base-content/50">Sector Size:</span>
                  <span class="text-base-content font-semibold">{{
                    formatBytes(actorDetail.SectorSize)
                  }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-base-content/50">QaP:</span>
                  <span class="text-base-content font-semibold">{{
                    actorDetail.Summary.QualityAdjustedPower
                  }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-base-content/50">Config Layers:</span>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="layer in actorDetail.Summary.CLayers"
                      :key="layer"
                      class="badge badge-outline badge-sm"
                    >
                      {{ layer }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            class="btn btn-outline btn-sm gap-2"
            :disabled="loading"
            @click="refresh"
          >
            <ArrowPathIcon
              class="h-4 w-4"
              :class="{ 'animate-spin': loading }"
            />
            Refresh
          </button>
        </div>
      </header>

      <div>
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
          <div class="card bg-base-100 border-base-300 border shadow-sm">
            <div class="card-header border-base-300 border-b px-4 py-4">
              <h3 class="text-lg font-semibold">Financial Information</h3>
            </div>
            <div class="card-body p-0">
              <DataTable>
                <tbody>
                  <tr>
                    <td class="font-medium">Actor Balance</td>
                    <td class="text-right font-medium">
                      {{ actorDetail.Summary.ActorBalance }}
                    </td>
                  </tr>
                  <tr>
                    <td class="font-medium">Available Balance</td>
                    <td class="text-right">
                      {{ actorDetail.Summary.ActorAvailable }}
                    </td>
                  </tr>
                  <tr>
                    <td class="font-medium">Worker Balance</td>
                    <td class="text-right">{{ actorDetail.WorkerBalance }}</td>
                  </tr>
                </tbody>
              </DataTable>
            </div>
          </div>

          <div class="card bg-base-100 border-base-300 border shadow-sm">
            <div class="card-header border-base-300 border-b px-4 py-4">
              <h3 class="text-lg font-semibold">Win Statistics</h3>
            </div>
            <div class="card-body p-0">
              <DataTable>
                <tbody>
                  <tr>
                    <td class="font-medium">Last 24 Hours</td>
                    <td class="text-right font-medium">
                      {{ actorDetail.Summary.Win1 }}
                    </td>
                  </tr>
                  <tr>
                    <td class="font-medium">Last 7 Days</td>
                    <td class="text-right font-medium">
                      {{ actorDetail.Summary.Win7 }}
                    </td>
                  </tr>
                  <tr>
                    <td class="font-medium">Last 30 Days</td>
                    <td class="text-right font-medium">
                      {{ actorDetail.Summary.Win30 }}
                    </td>
                  </tr>
                  <tr>
                    <td class="font-medium">Daily Average (30d)</td>
                    <td class="text-right">
                      {{
                        actorDetail.Summary.Win30 != null
                          ? Math.round((actorDetail.Summary.Win30 / 30) * 10) /
                            10
                          : "N/A"
                      }}
                    </td>
                  </tr>
                </tbody>
              </DataTable>
            </div>
          </div>

          <div
            v-if="
              actorDetail.BeneficiaryTerm || actorDetail.PendingBeneficiaryTerm
            "
            class="card bg-base-100 border-base-300 border shadow-sm"
          >
            <div class="card-header border-base-300 border-b px-4 py-4">
              <h3 class="text-lg font-semibold">Beneficiary Terms</h3>
            </div>
            <div class="card-body p-0">
              <DataTable>
                <tbody>
                  <tr v-if="actorDetail.BeneficiaryTerm">
                    <td class="font-medium">Current Quota</td>
                    <td class="text-right">
                      {{ actorDetail.BeneficiaryTerm.Quota }}
                    </td>
                  </tr>
                  <tr v-if="actorDetail.BeneficiaryTerm">
                    <td class="font-medium">Used Quota</td>
                    <td class="text-right">
                      {{ actorDetail.BeneficiaryTerm.UsedQuota }}
                    </td>
                  </tr>
                  <tr v-if="actorDetail.BeneficiaryTerm">
                    <td class="font-medium">Usage Percentage</td>
                    <td class="text-right">
                      <span v-if="beneficiaryUsage !== null">
                        {{ beneficiaryUsage }}%
                      </span>
                      <span v-else>—</span>
                    </td>
                  </tr>
                  <tr v-if="actorDetail.BeneficiaryTerm">
                    <td class="font-medium">Expiration</td>
                    <td class="text-right">
                      {{
                        formatEpochToDate(
                          actorDetail.BeneficiaryTerm.Expiration,
                        )
                      }}
                    </td>
                  </tr>
                  <tr v-if="actorDetail.PendingBeneficiaryTerm">
                    <td class="font-medium">Pending Changes</td>
                    <td class="text-right">
                      <span class="badge badge-warning badge-sm"
                        >Awaiting Approval</span
                      >
                    </td>
                  </tr>
                </tbody>
              </DataTable>
            </div>
          </div>

          <div class="card bg-base-100 border-base-300 border shadow-sm">
            <div class="card-header border-base-300 border-b px-4 py-4">
              <h3 class="text-lg font-semibold">Deadlines</h3>
            </div>
            <div class="card-body p-4">
              <div class="space-y-4">
                <DeadlineGrid
                  :deadlines="actorDetail.Summary.Deadlines"
                  :entity-id="actorDetail.Summary.Address"
                />
                <DeadlineLegend />
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8">
          <div class="card bg-base-100 border-base-300 border shadow-sm">
            <div class="card-header border-base-300 border-b px-4 py-4">
              <h3 class="text-lg font-semibold">Network & Identity</h3>
            </div>
            <div class="card-body p-0">
              <DataTable>
                <tbody>
                  <tr>
                    <td class="w-64 align-top font-medium">Owner Address</td>
                    <td class="align-top">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="font-mono text-sm break-all">{{
                          actorDetail.OwnerAddress
                        }}</span>
                        <CopyButton
                          :value="actorDetail.OwnerAddress"
                          :aria-label="`Copy owner address ${actorDetail.OwnerAddress}`"
                          size="sm"
                          :icon-only="true"
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="w-64 align-top font-medium">Beneficiary</td>
                    <td class="align-top">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="font-mono text-sm break-all">{{
                          actorDetail.Beneficiary
                        }}</span>
                        <CopyButton
                          :value="actorDetail.Beneficiary"
                          :aria-label="`Copy beneficiary address ${actorDetail.Beneficiary}`"
                          size="sm"
                          :icon-only="true"
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="w-64 align-top font-medium">Worker Address</td>
                    <td class="align-top">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="font-mono text-sm break-all">{{
                          actorDetail.WorkerAddress
                        }}</span>
                        <CopyButton
                          :value="actorDetail.WorkerAddress"
                          :aria-label="`Copy worker address ${actorDetail.WorkerAddress}`"
                          size="sm"
                          :icon-only="true"
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="w-64 align-top font-medium">Peer ID</td>
                    <td class="align-top">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="font-mono text-sm break-all">{{
                          actorDetail.PeerID
                        }}</span>
                        <CopyButton
                          :value="actorDetail.PeerID"
                          :aria-label="`Copy peer ID ${actorDetail.PeerID}`"
                          size="sm"
                          :icon-only="true"
                        />
                      </div>
                    </td>
                  </tr>
                  <tr v-if="actorDetail.PendingOwnerAddress">
                    <td class="w-64 align-top font-medium">Pending Owner</td>
                    <td class="align-top">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="badge badge-warning badge-sm"
                          >Pending</span
                        >
                        <span class="font-mono text-sm break-all">{{
                          actorDetail.PendingOwnerAddress
                        }}</span>
                        <CopyButton
                          :value="actorDetail.PendingOwnerAddress"
                          :aria-label="`Copy pending owner address ${actorDetail.PendingOwnerAddress}`"
                          size="sm"
                          :icon-only="true"
                        />
                      </div>
                    </td>
                  </tr>
                  <template
                    v-if="actorDetail.Address && actorDetail.Address.length > 0"
                  >
                    <tr
                      v-for="(address, index) in actorDetail.Address"
                      :key="`address-${index}`"
                    >
                      <td class="w-64 align-top font-medium">
                        Network Address {{ index + 1 }}
                      </td>
                      <td class="align-top">
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="font-mono text-sm break-all">{{
                            address
                          }}</span>
                          <CopyButton
                            :value="address"
                            :aria-label="`Copy network address ${address}`"
                            size="sm"
                            :icon-only="true"
                          />
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </DataTable>
            </div>
          </div>
        </div>

        <div class="mt-8 space-y-6">
          <ActorWalletsPanel :wallets="actorDetail.Wallets" />

          <ActorChartsPanel
            :sector-buckets="sectorBuckets ?? undefined"
            :loading="chartsLoading"
            :error="chartsError?.message"
          />
        </div>
      </div>
    </div>
  </DataSection>
</template>
