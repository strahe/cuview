<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { AdjustmentsHorizontalIcon } from "@heroicons/vue/24/outline";
import SectionCard from "@/components/ui/SectionCard.vue";
import { useCurioQuery } from "@/composables/useCurioQuery";
import { useLazyQuery } from "@/composables/useLazyQuery";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog.vue";

interface ToggleEntry {
  name: string;
  enabled: boolean;
}

const products = ref<ToggleEntry[]>([]);
const dataSources = ref<ToggleEntry[]>([]);
const loading = ref(false);
const error = ref<Error | null>(null);

const { call } = useCurioQuery();
const enableProduct = useLazyQuery<void>("EnableProduct");
const disableProduct = useLazyQuery<void>("DisableProduct");
const enableDataSource = useLazyQuery<void>("EnableDataSource");
const disableDataSource = useLazyQuery<void>("DisableDataSource");

const normalizeToggleResponse = (payload: unknown): ToggleEntry[] => {
  if (Array.isArray(payload)) {
    return payload as ToggleEntry[];
  }
  if (payload && typeof payload === "object") {
    return Object.entries(payload as Record<string, boolean>).map(
      ([name, enabled]) => ({
        name,
        enabled: Boolean(enabled),
      }),
    );
  }
  return [];
};

const confirmDialogOpen = ref(false);
const confirmContext = ref<{
  kind: "product" | "dataSource";
  entry: ToggleEntry;
  nextState: boolean;
} | null>(null);
const confirmLoading = ref(false);
const actionError = ref<string | null>(null);

const loadSettings = async () => {
  loading.value = true;
  error.value = null;
  actionError.value = null;

  try {
    const [productResult, dataSourceResult] = await Promise.all([
      call("ListProducts", []),
      call("ListDataSources", []),
    ]);
    products.value = normalizeToggleResponse(productResult);
    dataSources.value = normalizeToggleResponse(dataSourceResult);
  } catch (err) {
    error.value = err as Error;
    products.value = [];
    dataSources.value = [];
  } finally {
    loading.value = false;
  }
};

const requestToggle = (
  kind: "product" | "dataSource",
  entry: ToggleEntry,
  nextState: boolean,
) => {
  confirmContext.value = { kind, entry, nextState };
  confirmDialogOpen.value = true;
  actionError.value = null;
};

const resetConfirmation = () => {
  confirmDialogOpen.value = false;
  confirmContext.value = null;
  actionError.value = null;
};

const handleToggleProduct = async (entry: ToggleEntry, nextState: boolean) => {
  if (nextState) {
    await enableProduct.execute(entry.name);
  } else {
    await disableProduct.execute(entry.name);
  }
};

const handleToggleDataSource = async (
  entry: ToggleEntry,
  nextState: boolean,
) => {
  if (nextState) {
    await enableDataSource.execute(entry.name);
  } else {
    await disableDataSource.execute(entry.name);
  }
};

const confirmMessage = computed(() => {
  if (!confirmContext.value) {
    return {
      title: "",
      message: "",
      confirmText: "",
      type: "info" as const,
    };
  }

  const { kind, entry, nextState } = confirmContext.value;
  const label = kind === "product" ? "product" : "data source";
  const action = nextState ? "enable" : "disable";
  const tone = nextState ? ("info" as const) : ("danger" as const);

  return {
    title: `Confirm ${action}`,
    message: `Are you sure you want to ${action} ${label} "${entry.name}"?`,
    confirmText: nextState ? "Enable" : "Disable",
    type: tone,
  };
});

const handleConfirmToggle = async () => {
  if (!confirmContext.value) return;
  confirmLoading.value = true;
  actionError.value = null;

  try {
    const { kind, entry, nextState } = confirmContext.value;
    if (kind === "product") {
      await handleToggleProduct(entry, nextState);
    } else {
      await handleToggleDataSource(entry, nextState);
    }
    resetConfirmation();
    await loadSettings();
  } catch (err) {
    actionError.value =
      err instanceof Error ? err.message : "Failed to update setting";
  } finally {
    confirmLoading.value = false;
  }
};

onMounted(() => {
  void loadSettings();
});
</script>

<template>
  <SectionCard
    title="Settings"
    :icon="AdjustmentsHorizontalIcon"
    tooltip="MK20 products and data sources."
  >
    <div class="space-y-4">
      <div v-if="error" class="alert alert-error">
        <span>{{ error.message }}</span>
        <button class="btn btn-sm" :disabled="loading" @click="loadSettings">
          Retry
        </button>
      </div>

      <div v-if="actionError" class="alert alert-warning">
        <span>{{ actionError }}</span>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <div>
          <h3 class="text-base-content mb-2 text-sm font-semibold uppercase">
            Products
          </h3>
          <div class="border-base-300 overflow-hidden rounded-lg border">
            <table class="table w-full text-sm">
              <thead class="bg-base-200">
                <tr>
                  <th>Name</th>
                  <th class="w-32 text-center">Enabled</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="products.length === 0">
                  <td colspan="2" class="text-base-content/70 py-6 text-center">
                    No products found
                  </td>
                </tr>
                <tr v-for="product in products" :key="product.name">
                  <td class="font-medium">{{ product.name }}</td>
                  <td class="text-center">
                    <input
                      type="checkbox"
                      class="toggle toggle-success"
                      :checked="product.enabled"
                      :disabled="loading || confirmLoading"
                      @click.prevent="
                        requestToggle('product', product, !product.enabled)
                      "
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 class="text-base-content mb-2 text-sm font-semibold uppercase">
            Data Sources
          </h3>
          <div class="border-base-300 overflow-hidden rounded-lg border">
            <table class="table w-full text-sm">
              <thead class="bg-base-200">
                <tr>
                  <th>Name</th>
                  <th class="w-32 text-center">Enabled</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="dataSources.length === 0">
                  <td colspan="2" class="text-base-content/70 py-6 text-center">
                    No data sources found
                  </td>
                </tr>
                <tr v-for="source in dataSources" :key="source.name">
                  <td class="font-medium">{{ source.name }}</td>
                  <td class="text-center">
                    <input
                      type="checkbox"
                      class="toggle toggle-success"
                      :checked="source.enabled"
                      :disabled="loading || confirmLoading"
                      @click.prevent="
                        requestToggle('dataSource', source, !source.enabled)
                      "
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        v-model:show="confirmDialogOpen"
        v-bind="confirmMessage"
        :loading="confirmLoading"
        @confirm="handleConfirmToggle"
        @cancel="resetConfirmation"
      />
    </div>
  </SectionCard>
</template>
