import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  groupAndSum,
  toChartData,
  buildExpenseSummaryTiles,
  buildRevenueSummaryTiles,
  detectCurrentAndPreviousYear,
} from "@/lib/aggregator";
import {
  buildReserveSeries,
  preferredRowsForYear,
} from "@/lib/financial-series";
import { abbreviateCurrency, formatCurrency } from "@/lib/format";
import SummaryTiles from "@/components/portal/SummaryTiles";
import PieChart from "@/components/portal/PieChart";
import BarChart from "@/components/portal/BarChart";
import type { SummaryTile } from "@/types";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ townSlug: string }>;
}) {
  const { townSlug } = await params;
  const town = await prisma.town.findUnique({ where: { slug: townSlug } });
  if (!town) return notFound();

  const [tooltipRows, expenseRows, revenueRows, capitalRows, reserveRows] =
    await Promise.all([
      prisma.tooltip.findMany({
        where: { townId: town.id, scope: "category" },
      }),
      prisma.budgetRow.findMany({
        where: { townId: town.id, dataCategory: "expenses" },
      }),
      prisma.budgetRow.findMany({
        where: { townId: town.id, dataCategory: "revenues" },
      }),
      prisma.budgetRow.findMany({
        where: { townId: town.id, dataCategory: "capital" },
      }),
      prisma.budgetRow.findMany({
        where: { townId: town.id, dataCategory: "reserves" },
      }),
    ]);
  const categoryTooltips: Record<string, string> = {};
  for (const tooltip of tooltipRows) {
    categoryTooltips[tooltip.key] = tooltip.text;
  }

  const { currentYear, previousYear, allYears } =
    detectCurrentAndPreviousYear(expenseRows);
  const currentExpenses = preferredRowsForYear(expenseRows, currentYear);
  const previousExpenses = previousYear
    ? preferredRowsForYear(expenseRows, previousYear)
    : [];
  const expenseTiles = buildExpenseSummaryTiles(
    currentExpenses,
    previousExpenses
  );
  const expenseByFunction = toChartData(
    groupAndSum(currentExpenses, "functionArea")
  );

  const revenueYears = detectCurrentAndPreviousYear(revenueRows);
  const currentRevenues = preferredRowsForYear(
    revenueRows,
    revenueYears.currentYear
  );
  const previousRevenues = revenueYears.previousYear
    ? preferredRowsForYear(revenueRows, revenueYears.previousYear)
    : [];
  const revenueTiles = buildRevenueSummaryTiles(
    currentRevenues,
    previousRevenues
  );
  const revenueByCategory = toChartData(
    groupAndSum(currentRevenues, "category1")
  );

  const years = allYears.length > 0 ? allYears : [currentYear];
  const functions = [
    ...new Set(currentExpenses.map((row) => row.functionArea || "Other")),
  ];
  const expenseTrendSeries = functions.slice(0, 6).map((functionName) => ({
    label: functionName,
    data: years.map((year) =>
      preferredRowsForYear(expenseRows, year)
        .filter((row) => (row.functionArea || "Other") === functionName)
        .reduce((sum, row) => sum + row.amount, 0)
    ),
  }));

  const expenseTotal = currentExpenses.reduce(
    (sum, row) => sum + row.amount,
    0
  );
  const revenueTotal = currentRevenues.reduce(
    (sum, row) => sum + row.amount,
    0
  );
  const balance = revenueTotal - expenseTotal;
  const balanceTiles: SummaryTile[] = [
    {
      label: `FY${currentYear} Operating Budget`,
      value: abbreviateCurrency(expenseTotal),
    },
    {
      label: `FY${revenueYears.currentYear} Total Revenue`,
      value: abbreviateCurrency(revenueTotal),
    },
    {
      label: "Budget Balance",
      value: formatCurrency(balance),
      changeType: balance >= 0 ? "positive" : "negative",
    },
  ];

  const capitalYears = [...new Set(capitalRows.map((row) => row.fiscalYear))].sort(
    (a, b) => a.localeCompare(b, undefined, { numeric: true })
  );
  const latestCapitalYear = capitalYears.at(-1) ?? null;
  const latestCapitalRows = latestCapitalYear
    ? capitalRows.filter((row) => row.fiscalYear === latestCapitalYear)
    : [];
  const latestCapitalTotal = latestCapitalRows.reduce(
    (sum, row) => sum + row.amount,
    0
  );
  const reserves = buildReserveSeries(reserveRows);
  const latestReserveTotal = reserves.latestYear
    ? reserves.totalsByYear[reserves.latestYear] || 0
    : 0;
  const longTermTiles: SummaryTile[] = [];

  if (latestCapitalYear) {
    longTermTiles.push(
      {
        label: `FY${latestCapitalYear} Capital Investment`,
        value: abbreviateCurrency(latestCapitalTotal),
      },
      {
        label: "Capital Projects",
        value: latestCapitalRows.length.toString(),
      }
    );
  }
  if (reserves.latestYear) {
    longTermTiles.push(
      {
        label: `FY${reserves.latestYear} Total Reserves`,
        value: abbreviateCurrency(latestReserveTotal),
      },
      {
        label: "Reserve Funds",
        value: reserves.funds.length.toString(),
      }
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          FY{currentYear} Budget Overview
        </h1>
        <p className="text-gray-600 mt-1">
          Town of {town.name} financial summary
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 leading-relaxed">
          <strong>Welcome to {town.name}&apos;s budget portal.</strong> Compare
          adopted budgets with actual results, inspect capital investments and
          reserves, export the underlying tables, or open the{" "}
          <Link
            href={`/${town.slug}/budget-book`}
            className="underline font-medium"
          >
            printable Budget Book
          </Link>
          .
        </p>
      </div>

      <section>
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-medium">Operating Balance</h2>
            <p className="text-sm text-gray-600 mt-1">
              Adopted operating expenses compared with expected revenue
            </p>
          </div>
        </div>
        <SummaryTiles tiles={balanceTiles} />
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-medium">Expenses</h2>
            <p className="text-sm text-gray-600 mt-1">
              Spending by function area with a multi-year comparison
            </p>
          </div>
          <Link
            href={`/${town.slug}/expenses`}
            className="text-sm font-medium underline underline-offset-2"
            style={{ color: town.primaryColor }}
          >
            View expenses
          </Link>
        </div>
        <SummaryTiles tiles={expenseTiles} tooltips={categoryTooltips} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <PieChart
            data={expenseByFunction}
            title={`FY${currentYear} Expenses by Function`}
            townColor={town.primaryColor}
          />
          <BarChart
            categories={years.map((year) => `FY${year}`)}
            series={expenseTrendSeries}
            title="Expense Trend by Function"
            stacked
          />
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-medium">Revenues</h2>
            <p className="text-sm text-gray-600 mt-1">
              Taxes, state aid, local receipts, and other funding sources
            </p>
          </div>
          <Link
            href={`/${town.slug}/revenues`}
            className="text-sm font-medium underline underline-offset-2"
            style={{ color: town.primaryColor }}
          >
            View revenues
          </Link>
        </div>
        <SummaryTiles tiles={revenueTiles} tooltips={categoryTooltips} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <PieChart
            data={revenueByCategory}
            title={`FY${revenueYears.currentYear} Revenue by Category`}
            townColor={town.primaryColor}
          />
        </div>
      </section>

      {longTermTiles.length > 0 && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-medium">Capital &amp; Reserves</h2>
              <p className="text-sm text-gray-600 mt-1">
                Long-term investments and published financial cushions
              </p>
            </div>
            <div className="flex gap-4 text-sm font-medium">
              {latestCapitalYear && (
                <Link
                  href={`/${town.slug}/capital`}
                  className="underline underline-offset-2"
                  style={{ color: town.primaryColor }}
                >
                  View capital
                </Link>
              )}
              {reserves.latestYear && (
                <Link
                  href={`/${town.slug}/reserves`}
                  className="underline underline-offset-2"
                  style={{ color: town.primaryColor }}
                >
                  View reserves
                </Link>
              )}
            </div>
          </div>
          <SummaryTiles tiles={longTermTiles} />
        </section>
      )}
    </div>
  );
}
