"use client";

import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartData } from "@/types";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  "#4f46e5", "#059669", "#d97706", "#dc2626", "#7c3aed",
  "#0891b2", "#be185d", "#2563eb", "#65a30d", "#ea580c",
  "#6366f1", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6",
];

export default function PieChart({
  data,
  title,
  townColor,
}: {
  data: ChartData;
  title?: string;
  townColor?: string;
}) {
  const colors = townColor
    ? [townColor, ...COLORS.filter((c) => c !== townColor)]
    : COLORS;

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: colors.slice(0, data.labels.length),
        borderWidth: 2,
        borderColor: "#fff",
        hoverOffset: 4,
      },
    ],
  };

  const total = data.values.reduce((a, b) => a + b, 0);
  const summary = data.labels
    .map(
      (label, i) =>
        `${label}: $${data.values[i].toLocaleString()} (${((data.values[i] / total) * 100).toFixed(0)}%)`
    )
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
      <div className="max-w-[280px] mx-auto">
        <Pie
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: true,
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
                  label: (ctx) => {
                    const val = ctx.parsed;
                    const total = ctx.dataset.data.reduce(
                      (a: number, b: number) => a + b,
                      0
                    );
                    const pct = ((val / total) * 100).toFixed(1);
                    return ` ${ctx.label}: $${val.toLocaleString()} (${pct}%)`;
                  },
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
