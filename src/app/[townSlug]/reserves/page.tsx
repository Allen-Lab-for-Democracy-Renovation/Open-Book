import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { toChartData } from "@/lib/aggregator";
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
import BarChart from "@/components/portal/BarChart";
import BreakdownToggle from "@/components/portal/BreakdownToggle";
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
  const largestFund = series.funds[0];
  const tiles: SummaryTile[] = [
    {
      label: `FY${latestYear} Total Reserves`,
      value: abbreviateCurrency(latestTotal),
    },
    { label: "Largest Reserve Fund", value: largestFund?.name || "N/A" },
    { label: "Funds Tracked", value: series.funds.length.toString() },
  ];

  if (previousTotal !== null && previousTotal !== 0) {
    const change = calculateChange(previousTotal, latestTotal);
    tiles.push({
      label: "Change from Previous Year",
      value: formatPercent(change.percent),
      change: formatCurrency(change.absolute),
      changeType: change.percent >= 0 ? "positive" : "negative",
    });
  } else {
    tiles.push({
      label: "Fiscal Years",
      value: series.years.length.toString(),
    });
  }

  const fundData = {
    labels: series.funds.map((fund) => fund.name),
    values: series.funds.map((fund) => fund.balances[latestYear] || 0),
  };
  const categoryData = toChartData(series.categories);
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
        label: "Change",
      }
    : undefined;
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
          <p className="text-gray-600 mt-1">
            {series.funds.length} funds · {series.years.length} fiscal years
          </p>
        </div>
        <ExportButton
          data={exportData}
          filename={`${town.slug}-reserves-fy${latestYear}`}
        />
      </div>

      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
        <p className="text-sm text-cyan-900 leading-relaxed">
          <strong>Understanding reserves:</strong> Reserve, stabilization, free
          cash, and retained earnings balances help a municipality respond to
          unexpected costs, plan capital investments, and reduce reliance on
          short-term borrowing.
        </p>
      </div>

      <SummaryTiles tiles={tiles} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownToggle
          title="Reserve Composition"
          subtitle={`FY${latestYear} published balances`}
          primaryLabel="By Fund"
          primaryData={fundData}
          secondaryLabel="By Category"
          secondaryData={categoryData}
          townColor={town.primaryColor}
        />
        <BarChart
          categories={series.years.map((year) => `FY${year}`)}
          series={trendSeries}
          title="Reserve Balance Trend"
          stacked
        />
      </div>

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
