"use client";

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

interface BarChartProps {
  categories: string[];
  series: { label: string; data: number[] }[];
  title?: string;
  stacked?: boolean;
}

export default function BarChart({
  categories,
  series,
  title,
  stacked = false,
}: BarChartProps) {
  const chartData = {
    labels: categories,
    datasets: series.map((s, i) => ({
      label: s.label,
      data: s.data,
      backgroundColor: COLORS[i % COLORS.length],
      borderRadius: 3,
      maxBarThickness: 48,
    })),
  };

  const summary = series
    .map((s) => {
      const total = s.data.reduce((a, b) => a + b, 0);
      return `${s.label}: $${total.toLocaleString()} total`;
    })
    .join(", ");

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-5 transition-colors duration-150 hover:border-gray-300"
      role="figure"
      aria-label={title ? `${title}. ${summary}` : summary}
    >
      {title && (
        <h3 className="text-sm font-display font-medium text-gray-700 mb-4">{title}</h3>
      )}
      <div className="w-full" style={{ aspectRatio: "16/10", minHeight: "200px" }}>
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              x: {
                stacked,
                grid: { display: false },
                ticks: {
                  font: { size: 11, family: "Atkinson Hyperlegible" },
                },
              },
              y: {
                stacked,
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
                    ` ${ctx.dataset.label}: $${(ctx.parsed.y ?? 0).toLocaleString()}`,
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
