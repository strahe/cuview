<template>
  <div
    class="border-base-200 hover:bg-base-200/50 grid min-w-fit grid-cols-12 gap-2 border-b p-2 text-sm"
    :class="{ 'bg-warning/10': sector.Flag }"
  >
    <!-- Miner Address -->
    <div class="col-span-1 truncate" :title="sector.MinerAddress">
      {{ sector.MinerAddress }}
    </div>

    <!-- Sector Number -->
    <div class="col-span-1">
      <router-link
        :to="`/sectors/${sector.MinerAddress}/${sector.SectorNum}`"
        class="link link-primary"
      >
        {{ sector.SectorNum }}
      </router-link>
    </div>

    <!-- Expiry -->
    <div class="col-span-1">
      <span v-if="sector.ExpiresAt" :title="`Epoch ${sector.ExpiresAt}`">
        {{ formatEpoch(sector.ExpiresAt) }}
      </span>
      <span v-else class="text-base-content/50">-</span>
    </div>

    <!-- On-Chain Status -->
    <div class="col-span-1">
      <span
        v-if="sector.IsOnChain"
        class="badge badge-success badge-sm"
        title="On-Chain"
      >
        ✓
      </span>
      <span v-else class="text-base-content/30">-</span>
    </div>

    <!-- Proving Status -->
    <div class="col-span-1">
      <span
        v-if="sector.Proving"
        class="badge badge-success badge-sm"
        title="Proving"
      >
        ✓
      </span>
      <span v-else class="text-base-content/30">-</span>
    </div>

    <!-- Has Sealed -->
    <div class="col-span-1">
      <span
        v-if="sector.HasSealed"
        class="badge badge-primary badge-sm"
        title="Has Sealed"
      >
        S
      </span>
      <span v-else class="text-base-content/30">-</span>
    </div>

    <!-- Has Unsealed -->
    <div class="col-span-1">
      <span
        v-if="sector.HasUnsealed"
        class="badge badge-secondary badge-sm"
        title="Has Unsealed"
      >
        U
      </span>
      <span v-else class="text-base-content/30">-</span>
    </div>

    <!-- Deal Weight -->
    <div class="col-span-1 truncate" :title="sector.DealWeight">
      {{ sector.DealWeight }}
    </div>

    <!-- Deals -->
    <div class="col-span-2 truncate" :title="sector.Deals">
      {{ sector.Deals }}
    </div>

    <!-- Fil+ Status -->
    <div class="col-span-1">
      <span
        v-if="sector.IsFilPlus"
        class="badge badge-accent badge-sm"
        title="Fil+"
      >
        F+
      </span>
      <span v-else class="text-base-content/30">-</span>
    </div>

    <!-- Seal Size -->
    <div class="col-span-1 truncate" :title="sector.SealInfo">
      {{ sector.SealInfo }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SectorItem } from "@/types/sector";

interface Props {
  sector: SectorItem;
  index: number;
}

defineProps<Props>();

// Format epoch to relative time (simplified)
const formatEpoch = (epoch: number): string => {
  // This is a simplified conversion - in reality you'd need the current epoch
  // and network block time to calculate the actual date
  const BLOCKS_PER_HOUR = 120; // Approximate
  const hoursFromNow = Math.max(0, epoch - 3000000) / BLOCKS_PER_HOUR; // Rough estimate

  if (hoursFromNow < 24) {
    return `${Math.floor(hoursFromNow)}h`;
  } else if (hoursFromNow < 24 * 30) {
    return `${Math.floor(hoursFromNow / 24)}d`;
  } else {
    return `${Math.floor(hoursFromNow / 24 / 30)}mo`;
  }
};
</script>
