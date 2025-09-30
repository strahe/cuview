import { computed } from "vue";
import type { ApexOptions } from "apexcharts";
import { useLayoutStore } from "@/stores/layout";
import { getChartThemeTokens } from "@/utils/ui";

interface LineChartConfig {
  yAxisLabel: string;
  colors: string[];
  yAxisFormatter?: (value: number) => string;
  xAxisLabel?: string;
  xAxisFormatter?: (value: string | number) => string;
  height?: number;
  tooltipCustomFormatter?: (params: {
    seriesIndex: number;
    dataPointIndex: number;
    w: {
      globals: {
        initialSeries: Array<{
          name: string;
          data: Array<{ x: number | string; y: number }>;
          color?: string;
        }>;
      };
    };
  }) => string;
}

export function useLineChartConfig() {
  const layoutStore = useLayoutStore();

  return computed(
    () =>
      ({
        yAxisLabel,
        yAxisFormatter,
        xAxisLabel = "Days in Future",
        xAxisFormatter = (value: string | number) =>
          `${Math.round(Number(value))}d`,
        colors,
        height = 300,
        tooltipCustomFormatter,
      }: LineChartConfig): ApexOptions => {
        const tokens = getChartThemeTokens(layoutStore.isDark);

        return {
          chart: {
            type: "line",
            height,
            toolbar: { show: false },
            background: "transparent",
            fontFamily: "Inter, ui-sans-serif, system-ui",
            foreColor: tokens.axis,
          },
          stroke: {
            curve: "straight",
            width: layoutStore.isDark ? 3.6 : 3.2,
            lineCap: "round",
            colors,
          },
          fill: {
            type: "solid",
            colors,
            opacity: layoutStore.isDark ? 0.18 : 0.12,
          },
          colors,
          legend: {
            position: "top",
            horizontalAlign: "left",
            fontSize: "13px",
            fontWeight: 500,
            labels: {
              colors: tokens.legend,
            },
            itemMargin: {
              horizontal: 10,
              vertical: 2,
            },
            markers: {
              size: 8,
              strokeWidth: 2,
              fillColors: colors,
            },
          },
          tooltip: tooltipCustomFormatter
            ? {
                shared: false,
                followCursor: true,
                custom: tooltipCustomFormatter,
              }
            : {
                shared: false,
                followCursor: true,
                custom: ({ seriesIndex, dataPointIndex, w }) => {
                  const series = w.globals.initialSeries[seriesIndex];
                  const dataPoint = series?.data?.[dataPointIndex];

                  if (!series || !dataPoint) {
                    return "";
                  }

                  const xValue = dataPoint.x;
                  const formattedValue = yAxisFormatter
                    ? yAxisFormatter(Number(dataPoint.y))
                    : Number(dataPoint.y).toLocaleString();

                  return `
            <div
              style="
                background:${tokens.tooltipSurface};
                border:1px solid ${tokens.tooltipBorder};
                color:${tokens.tooltipText};
                border-radius:0.75rem;
                padding:0.75rem 1rem;
                min-width:14rem;
                box-shadow:0 12px 40px rgba(15,23,42,0.18);
              "
            >
              <div style="font-weight:600;font-size:0.9rem;display:flex;align-items:center;gap:0.5rem;">
                <span
                  style="display:inline-block;width:0.75rem;height:0.75rem;border-radius:9999px;background:${series.color ?? colors[seriesIndex]};"
                ></span>
                ${series.name}
              </div>
              <div style="font-size:1.05rem;font-weight:600;margin-top:0.35rem;">${formattedValue}</div>
              <div style="font-size:0.75rem;opacity:0.7;margin-top:0.35rem;">
                ${xValue}
              </div>
            </div>
          `;
                },
              },
          xaxis: {
            type: "numeric",
            decimalsInFloat: 0,
            title: {
              text: xAxisLabel,
              offsetY: -6,
              style: {
                color: tokens.axis,
                fontSize: "13px",
                fontWeight: 600,
              },
            },
            tickAmount: 6,
            labels: {
              style: {
                colors: tokens.axis,
                fontSize: "12px",
                fontWeight: 500,
              },
              formatter: xAxisFormatter,
            },
            axisBorder: {
              color: tokens.axisSubtle,
              height: 1,
            },
            axisTicks: {
              color: tokens.axisSubtle,
              height: 6,
            },
            crosshairs: {
              stroke: {
                color: tokens.axisSubtle,
                width: 1,
                dashArray: 4,
              },
            },
          },
          yaxis: {
            min: 0,
            title: {
              text: yAxisLabel,
              style: {
                color: tokens.axis,
                fontSize: "13px",
                fontWeight: 600,
              },
            },
            labels: {
              style: {
                colors: tokens.axis,
                fontSize: "12px",
                fontWeight: 500,
              },
              formatter: yAxisFormatter
                ? (value: string | number) => yAxisFormatter(Number(value))
                : (value: string | number) => Number(value).toLocaleString(),
            },
          },
          grid: {
            borderColor: tokens.grid,
            strokeDashArray: 4,
            xaxis: {
              lines: { show: true },
            },
            yaxis: {
              lines: { show: true },
            },
            padding: {
              top: 8,
              right: 10,
              bottom: 8,
              left: 6,
            },
          },
          dataLabels: {
            enabled: false,
          },
          markers: {
            size: 4.8,
            strokeWidth: 2.6,
            strokeColors: tokens.markerStroke,
            colors,
            hover: {
              size: 6.4,
              sizeOffset: 2.2,
            },
          },
        };
      },
  );
}
