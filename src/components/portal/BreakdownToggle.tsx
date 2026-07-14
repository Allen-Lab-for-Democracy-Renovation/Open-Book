"use client";

import { useState } from "react";
import type { ChartData } from "@/types";
import { abbreviateCurrency } from "@/lib/format";

interface BreakdownToggleProps {
  title: string;
  subtitle?: string;
  primaryLabel: string;
  primaryData: ChartData;
  secondaryLabel: string;
  secondaryData: ChartData;
  townColor: string;
}

export default function BreakdownToggle({
  title,
  subtitle,
  primaryLabel,
  primaryData,
  secondaryLabel,
  secondaryData,
  townColor,
}: BreakdownToggleProps) {
  const [mode, setMode] = useState<"primary" | "secondary">("primary");
  const data = mode === "primary" ? primaryData : secondaryData;
  const total = data.values.reduce((sum, value) => sum + value, 0);

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-5 min-h-[22rem]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div
          className="inline-flex self-start rounded-md border border-gray-200 bg-gray-50 p-0.5"
          role="group"
          aria-label={`${title} view`}
        >
          <button
            type="button"
            onClick={() => setMode("primary")}
            aria-pressed={mode === "primary"}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              mode === "primary"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            onClick={() => setMode("secondary")}
            aria-pressed={mode === "secondary"}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              mode === "secondary"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {secondaryLabel}
          </button>
        </div>
      </div>

      <ol className="space-y-3">
        {data.labels.map((label, index) => {
          const value = data.values[index] || 0;
          const percent = total > 0 ? (value / total) * 100 : 0;
          return (
            <li key={`${label}-${index}`}>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="font-medium text-gray-800 truncate">
                  {index + 1}. {label}
                </span>
                <span className="shrink-0 tabular-nums text-gray-700">
                  {percent.toFixed(1)}% · {abbreviateCurrency(value)}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-sm mt-1.5 overflow-hidden">
                <div
                  className="h-full rounded-sm"
                  style={{ width: `${Math.max(percent, 0.5)}%`, backgroundColor: townColor }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
