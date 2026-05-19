import type { BudgetRow } from "@/generated/prisma/client";
import type { ChartData, SummaryTile } from "@/types";
import { formatCurrency, abbreviateCurrency, formatPercent, calculateChange } from "./format";

export function groupAndSum(
  rows: BudgetRow[],
  groupField: keyof BudgetRow
): Record<string, number> {
  const groups: Record<string, number> = {};
  for (const row of rows) {
    const key = (row[groupField] as string) || "Other";
    groups[key] = (groups[key] || 0) + row.amount;
  }
  return groups;
}

export function toChartData(groups: Record<string, number>): ChartData {
  const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  return {
    labels: sorted.map(([k]) => k),
    values: sorted.map(([, v]) => v),
  };
}

export function buildExpenseSummaryTiles(
  currentRows: BudgetRow[],
  previousRows: BudgetRow[]
): SummaryTile[] {
  const currentTotal = currentRows.reduce((s, r) => s + r.amount, 0);

  const byFunction = groupAndSum(currentRows, "functionArea");
  const topFunction = Object.entries(byFunction).sort((a, b) => b[1] - a[1])[0];

  const tiles: SummaryTile[] = [
    { label: "Total Budget", value: abbreviateCurrency(currentTotal) },
    {
      label: "Largest Area",
      value: topFunction ? topFunction[0] : "N/A",
    },
  ];

  if (previousRows.length > 0) {
    const previousTotal = previousRows.reduce((s, r) => s + r.amount, 0);
    const change = calculateChange(previousTotal, currentTotal);
    tiles.push(
      {
        label: "$ Change from Last Year",
        value: formatCurrency(change.absolute),
        change: formatPercent(change.percent),
        changeType: change.absolute >= 0 ? "positive" : "negative",
      },
      {
        label: "% Change from Last Year",
        value: formatPercent(change.percent),
        changeType: change.percent >= 0 ? "positive" : "negative",
      }
    );
  }

  return tiles;
}

export function buildRevenueSummaryTiles(
  currentRows: BudgetRow[],
  previousRows: BudgetRow[]
): SummaryTile[] {
  const currentTotal = currentRows.reduce((s, r) => s + r.amount, 0);

  const byCat = groupAndSum(currentRows, "category1");
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

  const tiles: SummaryTile[] = [
    { label: "Total Revenue", value: abbreviateCurrency(currentTotal) },
    { label: "Top Source", value: topCat ? topCat[0] : "N/A" },
  ];

  if (previousRows.length > 0) {
    const previousTotal = previousRows.reduce((s, r) => s + r.amount, 0);
    const change = calculateChange(previousTotal, currentTotal);
    tiles.push(
      {
        label: "$ Change",
        value: formatCurrency(change.absolute),
        changeType: change.absolute >= 0 ? "positive" : "negative",
      },
      {
        label: "% Change",
        value: formatPercent(change.percent),
        changeType: change.percent >= 0 ? "positive" : "negative",
      }
    );
  }

  return tiles;
}

export function getDistinctFiscalYears(rows: BudgetRow[]): string[] {
  const years = [...new Set(rows.map((r) => r.fiscalYear))];
  return years.sort();
}

export function detectCurrentAndPreviousYear(rows: BudgetRow[]): {
  currentYear: string;
  previousYear: string | null;
  allYears: string[];
} {
  const years = getDistinctFiscalYears(rows);
  const budgetYears = years.filter((y) =>
    rows.some((r) => r.fiscalYear === y && r.amountType === "budget")
  );
  const currentYear = budgetYears.length > 0 ? budgetYears[budgetYears.length - 1] : years[years.length - 1] || "2026";
  const prevIndex = years.indexOf(currentYear) - 1;
  const previousYear = prevIndex >= 0 ? years[prevIndex] : null;
  return { currentYear, previousYear, allYears: years };
}

export function getDistinctFunds(rows: BudgetRow[]): { code: string; name: string }[] {
  const funds = new Map<string, string>();
  for (const row of rows) {
    if (row.fundCode) {
      funds.set(row.fundCode, row.fundName || row.fundCode);
    }
  }
  return Array.from(funds.entries()).map(([code, name]) => ({ code, name }));
}
