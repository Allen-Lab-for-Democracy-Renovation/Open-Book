import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  buildReserveSeries,
  createFinancialColumn,
} from "@/lib/financial-series";
import {
  abbreviateCurrency,
  calculateChange,
  formatCurrency,
  formatPercent,
} from "@/lib/format";
import PieChart from "@/components/portal/PieChart";
import QuickStats from "@/components/portal/QuickStats";
import TrendDrilldownChart from "@/components/portal/TrendDrilldownChart";
import BudgetTable from "@/components/portal/BudgetTable";
import ExportButton from "@/components/portal/ExportButton";
import SummaryTiles from "@/components/portal/SummaryTiles";
import type { SummaryTile } from "@/types";

export default async function ReservesPage({
  params,
}: {
  params: Promise<{ townSlug: string }>;
}) {
  const { townSlug } = await params;
  const town = await prisma.town.findUnique({ where: { slug: townSlug } });
  if (!town) return notFound();

  const rows = await prisma.budgetRow.findMany({
    where: { townId: town.id, dataCategory: "reserves" },
  });
  const series = buildReserveSeries(rows);

  if (!series.latestYear) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Reserves &amp; Stabilization
          </h1>
          <p className="text-gray-600 mt-1">
            Reserve fund balances across fiscal years
          </p>
        </div>
        <div className="border border-dashed border-gray-300 rounded-lg px-6 py-16 text-center bg-white">
          <h2 className="text-lg font-medium text-gray-800">
            No reserves data available yet
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Check back after reserve balances have been published.
          </p>
        </div>
      </div>
    );
  }

  const latestYear = series.latestYear;
  const latestTotal = series.totalsByYear[latestYear] || 0;
  const previousTotal = series.previousYear
    ? series.totalsByYear[series.previousYear] || 0
    : null;
  const hasPriorYear = previousTotal !== null && previousTotal !== 0;
  const yearRangeLabel = `FY${series.previousYear} – FY${latestYear}`;
  const largestFund = series.funds[0];

  const tiles: SummaryTile[] = [
    {
      label: `FY${latestYear} Total Reserves`,
      value: abbreviateCurrency(latestTotal),
    },
    { label: "Largest Reserve Fund", value: largestFund?.name || "N/A" },
    ...(hasPriorYear && previousTotal !== null
      ? (() => {
          const change = calculateChange(previousTotal, latestTotal);
          return [
            {
              label: `$ Change (${yearRangeLabel})`,
              value: formatCurrency(change.absolute),
            },
            {
              label: `% Change (${yearRangeLabel})`,
              value: formatPercent(change.percent),
            },
          ];
        })()
      : []),
  ];

  const fundData = {
    labels: series.funds.map((fund) => fund.name),
    values: series.funds.map((fund) => fund.balances[latestYear] || 0),
  };
  const trendSeries = series.funds.slice(0, 8).map((fund) => ({
    label: fund.name,
    data: series.years.map((year) => fund.balances[year] || 0),
  }));
  const reserveColumns = series.years.map((year) =>
    createFinancialColumn(year, series.amountTypesByYear[year] || "balance")
  );
  const tableRows = series.funds.map((fund) => ({
    id: fund.name,
    cells: [
      fund.name,
      fund.category,
      ...series.years.map((year) => fund.balances[year] || null),
    ],
  }));
  const comparison = series.previousYear
    ? {
        fromKey: createFinancialColumn(
          series.previousYear,
          series.amountTypesByYear[series.previousYear] || "balance"
        ).key,
        toKey: createFinancialColumn(
          latestYear,
          series.amountTypesByYear[latestYear] || "balance"
        ).key,
        label: `% Change (${yearRangeLabel})`,
      }
    : undefined;

  const fundEntries = series.funds.map(
    (fund) => [fund.name, fund.balances[latestYear] || 0] as [string, number]
  );
  const quickStats = [
    { label: "Funds tracked", value: series.funds.length.toString() },
    ...(fundEntries[0]
      ? [
          {
            label: "Largest fund",
            value: fundEntries[0][0],
            detail: `${((fundEntries[0][1] / latestTotal) * 100).toFixed(1)}% · ${formatCurrency(fundEntries[0][1])}`,
          },
        ]
      : []),
    ...(fundEntries[1]
      ? [
          {
            label: "Second largest",
            value: fundEntries[1][0],
            detail: `${((fundEntries[1][1] / latestTotal) * 100).toFixed(1)}% · ${formatCurrency(fundEntries[1][1])}`,
          },
        ]
      : []),
  ];

  const exportData = series.funds.map((fund) => {
    const balances: Record<string, string> = {};
    for (const column of reserveColumns) {
      balances[column.label] = formatCurrency(
        fund.balances[column.fiscalYear] || 0
      );
    }
    return {
      "Fund Name": fund.name,
      Category: fund.category,
      ...balances,
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Reserves &amp; Stabilization
          </h1>
        </div>
        <ExportButton
          data={exportData}
          filename={`${town.slug}-reserves-fy${latestYear}`}
        />
      </div>

      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
        <p className="text-sm text-cyan-900 leading-relaxed">
          <strong>How to read this page:</strong> The summary tiles show the
          big picture — total reserves, the largest fund, and how it changed
          from last year. Reserve, stabilization, free cash, and retained
          earnings balances help a municipality respond to unexpected costs,
          plan capital investments, and reduce reliance on short-term
          borrowing. The chart below breaks reserves down visually, and
          further down is a searchable table with every fund&apos;s
          published balance by year.
        </p>
      </div>

      <SummaryTiles tiles={tiles} />

      <section>
        <h2 className="text-lg font-medium">Reserve Composition</h2>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          FY{latestYear} published balances by fund
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PieChart
            data={fundData}
            title={`FY${latestYear} Reserves by Fund`}
            townColor={town.primaryColor}
          />
          <QuickStats title="Overview" stats={quickStats} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">Reserve Balance Trend</h2>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          Compare published balances across recent fiscal years
        </p>
        <TrendDrilldownChart
          title="Multi-Year Reserve Balance Trend"
          categories={series.years.map((year) => `FY${year}`)}
          topSeries={trendSeries}
          drilldownSeries={{}}
          drilldownLabel=""
        />
      </section>

      <section>
        <h2 className="text-lg font-medium">Reserve Fund Detail</h2>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          Historical published balances by fund
        </p>
        <BudgetTable
          headers={["Fund Name", "Category"]}
          rows={tableRows}
          searchPlaceholder="Search reserve funds..."
          collapsible={false}
          seriesColumns={{
            columns: reserveColumns.map(({ key, label }) => ({ key, label })),
            defaultSelectedKeys: reserveColumns.map(({ key }) => key),
            comparison,
          }}
        />
      </section>
    </div>
  );
}
