"use client";

import { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const COLORS = [
  "#4f46e5", "#059669", "#d97706", "#dc2626", "#7c3aed",
  "#0891b2", "#be185d", "#2563eb", "#65a30d", "#ea580c",
];

interface Series {
  label: string;
  data: number[];
}

interface TrendDrilldownChartProps {
  title: string;
  categories: string[];
  topSeries: Series[];
  drilldownSeries: Record<string, Series[]>;
  drilldownLabel: string;
  drilldownHint?: string;
}

export default function TrendDrilldownChart({
  title,
  categories,
  topSeries,
  drilldownSeries,
  drilldownLabel,
  drilldownHint = "Click a bar segment to see the breakdown",
}: TrendDrilldownChartProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const canDrilldown = (label: string) =>
    !!drilldownSeries[label] && drilldownSeries[label].length > 0;
  const hasAnyDrilldown = Object.values(drilldownSeries).some(
    (series) => series.length > 0
  );

  const activeSeries = selected ? drilldownSeries[selected] ?? [] : topSeries;

  const chartData = {
    labels: categories,
    datasets: activeSeries.map((s, i) => ({
      label: s.label,
      data: s.data,
      backgroundColor: COLORS[i % COLORS.length],
      borderRadius: 3,
      maxBarThickness: 48,
    })),
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h3 className="text-sm font-display font-medium text-gray-700">
          {selected ? `${selected} — ${drilldownLabel}` : title}
        </h3>
        {selected && (
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 shrink-0"
          >
            ← Back to all
          </button>
        )}
      </div>
      {(selected || hasAnyDrilldown) && (
        <p className="text-xs text-gray-500 mb-4">
          {selected ? `${drilldownLabel} within ${selected}` : drilldownHint}
        </p>
      )}
      <div
        className="w-full"
        style={{ height: `${Math.max(160, categories.length * 70 + 80)}px` }}
      >
        <Bar
          data={chartData}
          options={{
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            onClick: (_event, elements) => {
              if (selected || elements.length === 0) return;
              const datasetIndex = elements[0].datasetIndex;
              const label = topSeries[datasetIndex]?.label;
              if (label && canDrilldown(label)) {
                setSelected(label);
              }
            },
            onHover: (event, elements) => {
              const target = event.native?.target as HTMLElement | undefined;
              if (!target) return;
              const hoveringDrillable =
                !selected &&
                elements.length > 0 &&
                canDrilldown(topSeries[elements[0].datasetIndex]?.label ?? "");
              target.style.cursor = hoveringDrillable ? "pointer" : "default";
            },
            scales: {
              x: {
                stacked: true,
                grid: { color: "oklch(0.92 0.005 80)" },
                ticks: {
                  font: { size: 11, family: "Atkinson Hyperlegible" },
                  callback: (value) => {
                    const n = Number(value);
                    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
                    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
                    return `$${n}`;
                  },
                },
              },
              y: {
                stacked: true,
                grid: { display: false },
                ticks: {
                  font: { size: 11, family: "Atkinson Hyperlegible" },
                },
              },
            },
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  font: { size: 11, family: "Atkinson Hyperlegible" },
                  padding: 12,
                  usePointStyle: true,
                  pointStyleWidth: 8,
                },
              },
              tooltip: {
                backgroundColor: "rgba(23, 23, 23, 0.92)",
                titleFont: { family: "Atkinson Hyperlegible", size: 12 },
                bodyFont: { family: "Atkinson Hyperlegible", size: 12 },
                padding: 10,
                cornerRadius: 6,
                callbacks: {
                  label: (ctx) =>
                    ` ${ctx.dataset.label}: $${(ctx.parsed.x ?? 0).toLocaleString()}`,
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
