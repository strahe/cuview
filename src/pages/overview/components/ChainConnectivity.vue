<script setup lang="ts">
import { useCachedQuery } from "@/composables/useCachedQuery";
import { ArrowPathIcon } from "@heroicons/vue/24/outline";
import type { SyncerStateItem } from "@/types/sync";

const {
  data: syncerData,
  loading,
  error,
  hasData,
  refresh,
} = useCachedQuery<SyncerStateItem[]>("SyncerState", [], {
  pollingInterval: 30000,
});
</script>

<template>
  <div
    class="border-base-300/30 bg-base-100 overflow-x-auto rounded-lg border shadow-sm"
  >
    <table class="table w-full">
      <thead class="bg-base-200/50">
        <tr class="border-base-300/50 border-b">
          <th
            class="border-base-300/30 text-base-content border-r bg-transparent px-3 py-3 font-medium"
          >
            RPC Address
          </th>
          <th
            class="border-base-300/30 text-base-content border-r bg-transparent px-3 py-3 font-medium"
          >
            Reachability
          </th>
          <th
            class="border-base-300/30 text-base-content border-r bg-transparent px-3 py-3 font-medium"
          >
            Sync Status
          </th>
          <th class="text-base-content bg-transparent px-3 py-3 font-medium">
            Version
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-if="error">
          <tr>
            <td colspan="4" class="py-8 text-center">
              <div
                class="bg-error/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full"
              >
                <div class="text-error text-xl">⚠️</div>
              </div>
              <h3 class="text-base-content mb-2 font-semibold">
                Connection Failed
              </h3>
              <p class="text-base-content/70 mb-4 text-sm">
                {{ error.message }}
              </p>
              <button
                class="btn btn-outline btn-sm"
                :disabled="loading"
                @click="refresh"
              >
                <span
                  v-if="loading"
                  class="loading loading-spinner loading-xs"
                ></span>
                <ArrowPathIcon v-else class="size-4" />
                <span class="ml-2">{{
                  loading ? "Retrying..." : "Retry Connection"
                }}</span>
              </button>
            </td>
          </tr>
        </template>
        <template v-else-if="loading && !hasData">
          <tr>
            <td colspan="4" class="text-base-content/60 py-8 text-center">
              <div
                class="loading loading-spinner loading-md mx-auto mb-4"
              ></div>
              <div>Connecting to blockchain...</div>
            </td>
          </tr>
        </template>
        <template v-else-if="!hasData">
          <tr>
            <td colspan="4" class="text-base-content/60 py-8 text-center">
              <div class="mb-2 text-2xl">🔗</div>
              <div>No RPC connections configured</div>
            </td>
          </tr>
        </template>
        <template v-else>
          <tr
            v-for="item in syncerData"
            :key="item.Address"
            class="bg-base-100 hover:bg-base-200/50 transition-colors"
          >
            <td class="border-base-300/30 border-r px-3 py-3 font-mono text-sm">
              {{ item.Address }}
            </td>
            <td class="border-base-300/30 border-r px-3 py-3">
              <span
                v-if="item.Reachable"
                class="text-success text-sm font-medium"
              >
                ok
              </span>
              <span v-else class="text-error text-sm font-medium">FAIL</span>
            </td>
            <td class="border-base-300/30 border-r px-3 py-3">
              <span
                v-if="item.SyncState === 'ok'"
                class="text-success text-sm font-medium"
              >
                ok
              </span>
              <span v-else class="text-warning text-sm font-medium">
                No{{ item.SyncState ? ", " + item.SyncState : "" }}
              </span>
            </td>
            <td class="text-base-content/70 px-3 py-3 text-sm">
              {{ item.Version }}
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
