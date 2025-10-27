<script setup lang="ts">
import { computed, ref, watch } from "vue";
import VueApexCharts from "vue3-apexcharts";
import ChartCard from "@/components/ui/ChartCard.vue";
import type { SectorBuckets } from "@/types/actor";
import { formatBytes } from "@/utils/format";
import { epochToDays } from "@/utils/filecoin";
import { getChartThemeTokens } from "@/utils/ui";
import { useLineChartConfig } from "@/composables/useApexChartConfig";
import { useLayoutStore } from "@/stores/layout";

interface Props {
  sectorBuckets?: SectorBuckets;
  loading?: boolean;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  sectorBuckets: undefined,
  loading: false,
  error: undefined,
});

const chartError = ref<string | null>(null);

const layoutStore = useLayoutStore();
const themeTokens = computed(() => getChartThemeTokens(layoutStore.isDark));
const createLineChartOptions = useLineChartConfig();

const nowEpoch = computed(() => {
  if (!props.sectorBuckets) return 0;

  const firstAll = props.sectorBuckets.All[0]?.BucketEpoch ?? Infinity;
  const firstCC = props.sectorBuckets.CC[0]?.BucketEpoch ?? Infinity;
  return Math.min(firstAll, firstCC);
});

const formatFIL = (attoFIL: number) => {
  const fil = attoFIL / 1e18;
  if (fil >= 1_000_000) return `${(fil / 1_000_000).toFixed(2)}M FIL`;
  if (fil >= 1_000) return `${(fil / 1_000).toFixed(2)}K FIL`;
  return `${fil.toFixed(2)} FIL`;
};

const expirationChartSeries = computed(() => {
  try {
    if (!props.sectorBuckets) {
      return [];
    }

    const allData = props.sectorBuckets.All.map((bucket) => ({
      x: epochToDays(bucket.BucketEpoch, nowEpoch.value),
      y: bucket.Count,
    })).sort((a, b) => a.x - b.x);

    const ccData = props.sectorBuckets.CC.map((bucket) => ({
      x: epochToDays(bucket.BucketEpoch, nowEpoch.value),
      y: bucket.Count,
    })).sort((a, b) => a.x - b.x);

    return [
      {
        name: "All Sectors",
        data: allData,
        color: "var(--color-primary)",
      },
      {
        name: "CC Sectors",
        data: ccData,
        color: "var(--color-secondary)",
      },
    ];
  } catch (err) {
    console.error("Failed to process expiration chart data:", err);
    return [];
  }
});

const qapChartSeries = computed(() => {
  try {
    if (!props.sectorBuckets) {
      return [];
    }

    const qapData = props.sectorBuckets.All.map((bucket) => ({
      x: epochToDays(bucket.BucketEpoch, nowEpoch.value),
      y: Number(bucket.QAP),
    })).sort((a, b) => a.x - b.x);

    return [
      {
        name: "Quality-Adjusted Power",
        data: qapData,
        color: "var(--color-accent)",
      },
    ];
  } catch (err) {
    console.error("Failed to process QAP chart data:", err);
    return [];
  }
});

const lockedFundsChartSeries = computed(() => {
  try {
    if (!props.sectorBuckets) {
      return [];
    }

    const lockedData = props.sectorBuckets.All.map((bucket) => ({
      x: epochToDays(bucket.BucketEpoch, nowEpoch.value),
      y: Number(bucket.VestedLockedFunds) / 1e18,
    })).sort((a, b) => a.x - b.x);

    return [
      {
        name: "Locked Funds",
        data: lockedData,
        color: "var(--color-warning)",
      },
    ];
  } catch (err) {
    console.error("Failed to process locked funds chart data:", err);
    return [];
  }
});

const expirationOptions = computed(() =>
  createLineChartOptions.value({
    yAxisLabel: "Count",
    colors: ["var(--color-primary)", "var(--color-secondary)"],
    tooltipCustomFormatter: ({ seriesIndex, dataPointIndex, w }) => {
      const series = w.globals.initialSeries[seriesIndex];
      const dataPoint = series?.data?.[dataPointIndex];

      if (!series || !dataPoint) {
        return "";
      }

      const days = dataPoint.x as number;
      const roundedDays = Math.round(days);
      const months = (roundedDays / 30).toFixed(1);
      const formattedValue = Number(dataPoint.y).toLocaleString();

      return `
        <div
          style="
            background:${themeTokens.value.tooltipSurface};
            border:1px solid ${themeTokens.value.tooltipBorder};
            color:${themeTokens.value.tooltipText};
            border-radius:0.75rem;
            padding:0.75rem 1rem;
            min-width:14rem;
            box-shadow:0 12px 40px rgba(15,23,42,0.18);
          "
        >
          <div style="font-weight:600;font-size:0.9rem;display:flex;align-items:center;gap:0.5rem;">
            <span
              style="display:inline-block;width:0.75rem;height:0.75rem;border-radius:9999px;background:${series.color ?? ["var(--color-primary)", "var(--color-secondary)"][seriesIndex]};"
            ></span>
            ${series.name}
          </div>
          <div style="font-size:1.05rem;font-weight:600;margin-top:0.35rem;">${formattedValue}</div>
          <div style="font-size:0.75rem;opacity:0.7;margin-top:0.35rem;">
            ${roundedDays} days (${months} months)
          </div>
        </div>
      `;
    },
  }),
);

const qapOptions = computed(() =>
  createLineChartOptions.value({
    yAxisLabel: "QAP",
    colors: ["var(--color-accent)"],
    yAxisFormatter: (value) => formatBytes(Number(value)),
    height: 260,
    tooltipCustomFormatter: ({ seriesIndex, dataPointIndex, w }) => {
      const series = w.globals.initialSeries[seriesIndex];
      const dataPoint = series?.data?.[dataPointIndex];

      if (!series || !dataPoint) {
        return "";
      }

      const days = dataPoint.x as number;
      const roundedDays = Math.round(days);
      const months = (roundedDays / 30).toFixed(1);
      const formattedValue = formatBytes(Number(dataPoint.y));

      return `
        <div
          style="
            background:${themeTokens.value.tooltipSurface};
            border:1px solid ${themeTokens.value.tooltipBorder};
            color:${themeTokens.value.tooltipText};
            border-radius:0.75rem;
            padding:0.75rem 1rem;
            min-width:14rem;
            box-shadow:0 12px 40px rgba(15,23,42,0.18);
          "
        >
          <div style="font-weight:600;font-size:0.9rem;display:flex;align-items:center;gap:0.5rem;">
            <span
              style="display:inline-block;width:0.75rem;height:0.75rem;border-radius:9999px;background:${series.color ?? "var(--color-accent)"};"
            ></span>
            ${series.name}
          </div>
          <div style="font-size:1.05rem;font-weight:600;margin-top:0.35rem;">${formattedValue}</div>
          <div style="font-size:0.75rem;opacity:0.7;margin-top:0.35rem;">
            ${roundedDays} days (${months} months)
          </div>
        </div>
      `;
    },
  }),
);

const lockedFundsOptions = computed(() =>
  createLineChartOptions.value({
    yAxisLabel: "Locked Funds (FIL)",
    colors: ["var(--color-warning)"],
    yAxisFormatter: (value) => formatFIL(Number(value) * 1e18),
    height: 260,
    tooltipCustomFormatter: ({ seriesIndex, dataPointIndex, w }) => {
      const series = w.globals.initialSeries[seriesIndex];
      const dataPoint = series?.data?.[dataPointIndex];

      if (!series || !dataPoint) {
        return "";
      }

      const days = dataPoint.x as number;
      const roundedDays = Math.round(days);
      const months = (roundedDays / 30).toFixed(1);
      const formattedValue = formatFIL(Number(dataPoint.y) * 1e18);

      return `
        <div
          style="
            background:${themeTokens.value.tooltipSurface};
            border:1px solid ${themeTokens.value.tooltipBorder};
            color:${themeTokens.value.tooltipText};
            border-radius:0.75rem;
            padding:0.75rem 1rem;
            min-width:14rem;
            box-shadow:0 12px 40px rgba(15,23,42,0.18);
          "
        >
          <div style="font-weight:600;font-size:0.9rem;display:flex;align-items:center;gap:0.5rem;">
            <span
              style="display:inline-block;width:0.75rem;height:0.75rem;border-radius:9999px;background:${series.color ?? "var(--color-warning)"};"
            ></span>
            ${series.name}
          </div>
          <div style="font-size:1.05rem;font-weight:600;margin-top:0.35rem;">${formattedValue}</div>
          <div style="font-size:0.75rem;opacity:0.7;margin-top:0.35rem;">
            ${roundedDays} days (${months} months)
          </div>
        </div>
      `;
    },
  }),
);

const hasData = computed(() => {
  return (
    props.sectorBuckets &&
    (props.sectorBuckets.All.length > 0 || props.sectorBuckets.CC.length > 0)
  );
});

// Watch for chart errors
watch(
  [expirationChartSeries, qapChartSeries, lockedFundsChartSeries],
  ([expiration, qap, locked]) => {
    if (
      expiration.length === 0 &&
      qap.length === 0 &&
      locked.length === 0 &&
      props.sectorBuckets &&
      !props.error
    ) {
      chartError.value = "Failed to process chart data";
    } else {
      chartError.value = null;
    }
  },
);
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <ChartCard
        class="xl:col-span-2"
        title="Sector Expiration Timeline"
        description="Distribution of sector expirations over time"
        accent="primary"
        description-variant="tooltip"
        :padded="false"
        :loading="true"
        :skeleton-height="300"
      />
      <ChartCard
        title="Quality-Adjusted Power"
        description="Storage capacity adjusted for quality and commitment"
        accent="accent"
        description-variant="tooltip"
        :padded="false"
        :loading="true"
        :skeleton-height="260"
      />
      <ChartCard
        title="Vested Locked Funds"
        description="Timeline of locked funds vesting schedule"
        accent="warning"
        description-variant="tooltip"
        :padded="false"
        :loading="true"
        :skeleton-height="260"
      />
    </div>

    <ChartCard
      v-else-if="error || chartError"
      title="Chart Data Error"
      description="We were unable to load sector statistics for this actor."
      accent="error"
    >
      <div class="alert alert-error">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 class="font-semibold">Unable to render charts</h3>
          <p class="text-sm opacity-80">{{ error || chartError }}</p>
        </div>
      </div>
    </ChartCard>

    <ChartCard
      v-else-if="!hasData"
      title="No Chart Data Available"
      description="This actor has no sector bucket data to visualise yet."
      accent="info"
    >
      <div
        class="border-base-300 bg-base-100 text-base-content/70 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="text-info h-10 w-10"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.8"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p class="max-w-md text-sm">
          Once sectors begin reporting bucket data, charts for expiration, QAP,
          and locked funds will appear here automatically.
        </p>
      </div>
    </ChartCard>

    <div v-else class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <ChartCard
        class="xl:col-span-2"
        title="Sector Expiration Timeline"
        description="Distribution of sector expirations over time"
        accent="primary"
        description-variant="tooltip"
        :padded="false"
        :skeleton-height="300"
      >
        <div class="px-3 pt-3 pb-4 md:px-4 md:pb-4">
          <VueApexCharts
            width="100%"
            height="300"
            type="line"
            :options="expirationOptions"
            :series="expirationChartSeries"
          />
        </div>
      </ChartCard>

      <ChartCard
        title="Quality-Adjusted Power"
        description="Storage capacity adjusted for quality and commitment"
        accent="accent"
        description-variant="tooltip"
        :padded="false"
      >
        <div class="px-3 pt-3 pb-4 md:px-4 md:pb-4">
          <VueApexCharts
            width="100%"
            height="260"
            type="line"
            :options="qapOptions"
            :series="qapChartSeries"
          />
        </div>
      </ChartCard>

      <ChartCard
        title="Vested Locked Funds"
        description="Timeline of locked funds vesting schedule"
        accent="warning"
        description-variant="tooltip"
        :padded="false"
      >
        <div class="px-3 pt-3 pb-4 md:px-4 md:pb-4">
          <VueApexCharts
            width="100%"
            height="260"
            type="line"
            :options="lockedFundsOptions"
            :series="lockedFundsChartSeries"
          />
        </div>
      </ChartCard>
    </div>
  </div>
</template>
