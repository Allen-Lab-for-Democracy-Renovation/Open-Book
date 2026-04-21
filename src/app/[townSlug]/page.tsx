import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { groupAndSum, toChartData, buildExpenseSummaryTiles, buildRevenueSummaryTiles, detectCurrentAndPreviousYear } from "@/lib/aggregator";
import SummaryTiles from "@/components/portal/SummaryTiles";
import PieChart from "@/components/portal/PieChart";
import BarChart from "@/components/portal/BarChart";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ townSlug: string }>;
}) {
  const { townSlug } = await params;
  const town = await prisma.town.findUnique({ where: { slug: townSlug } });
  if (!town) return notFound();

  // Fetch tooltips
  const tooltipRows = await prisma.tooltip.findMany({
    where: { townId: town.id, scope: "category" },
  });
  const categoryTooltips: Record<string, string> = {};
  for (const t of tooltipRows) {
    categoryTooltips[t.key] = t.text;
  }

  // Get expense data
  const expenseRows = await prisma.budgetRow.findMany({
    where: { townId: town.id, dataCategory: "expenses" },
  });

  const { currentYear, previousYear, allYears } = detectCurrentAndPreviousYear(expenseRows);

  const currentExpenses = expenseRows.filter(
    (r) => r.fiscalYear === currentYear && r.amountType === "budget"
  );
  const prevExpenses = expenseRows.filter(
    (r) => r.fiscalYear === previousYear && (r.amountType === "budget" || r.amountType === "actual")
  );

  const expenseTiles = buildExpenseSummaryTiles(currentExpenses, prevExpenses);
  const expenseByFunction = toChartData(
    groupAndSum(currentExpenses, "functionArea")
  );

  // Get revenue data
  const revenueRows = await prisma.budgetRow.findMany({
    where: { townId: town.id, dataCategory: "revenues" },
  });

  const revYears = detectCurrentAndPreviousYear(revenueRows);
  const currentRevenues = revenueRows.filter(
    (r) => r.fiscalYear === revYears.currentYear && r.amountType === "budget"
  );
  const prevRevenues = revenueRows.filter(
    (r) => r.fiscalYear === revYears.previousYear && (r.amountType === "actual" || r.amountType === "budget")
  );

  const revenueTiles = buildRevenueSummaryTiles(currentRevenues, prevRevenues);
  const revenueByCategory = toChartData(
    groupAndSum(currentRevenues, "category1")
  );

  const years = allYears.length > 0 ? allYears : [previousYear, currentYear];
  const byFunctionByYear = new Map<string, number[]>();
  const functions = [...new Set(currentExpenses.map((r) => r.functionArea || "Other"))];

  for (const fn of functions) {
    byFunctionByYear.set(
      fn,
      years.map((y) =>
        expenseRows
          .filter(
            (r) =>
              r.functionArea === fn &&
              r.fiscalYear === y &&
              (r.amountType === "budget" || r.amountType === "actual")
          )
          .reduce((s, r) => s + r.amount, 0)
      )
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          FY{currentYear} Budget Overview
        </h1>
        <p className="text-gray-500 mt-1">
          Town of {town.name} financial summary
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 leading-relaxed">
          <strong>Welcome to {town.name}&apos;s budget portal.</strong>{" "}
          This page gives you a high-level snapshot of the town&apos;s finances.
          Use the tabs above to explore expenses, revenues, and capital
          projects in detail. All dollar amounts shown are from the
          town&apos;s official budget documents. You can export any table to
          a spreadsheet using the Export button, or generate a complete{" "}
          <a href={`/${town.slug}/budget-book`} className="underline font-medium">Budget Book</a>{" "}
          for printing. Have a question?{" "}
          <a href={`/${town.slug}/ask`} className="underline font-medium">Ask here</a>.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-medium mb-1">Expenses</h2>
        <p className="text-sm text-gray-500 mb-4">
          How the town spends money — broken down by department and function area.
          The tiles below show the big picture; scroll down for line-by-line detail.
        </p>
        <SummaryTiles tiles={expenseTiles} tooltips={categoryTooltips} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <PieChart
            data={expenseByFunction}
            title={`FY${currentYear} Expenses by Function`}
            townColor={town.primaryColor}
          />
          <BarChart
            categories={years.map((y) => `FY${y}`)}
            series={functions.slice(0, 6).map((fn) => ({
              label: fn,
              data: byFunctionByYear.get(fn) || [],
            }))}
            title="Expense Trend by Function"
            stacked
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-1">Revenues</h2>
        <p className="text-sm text-gray-500 mb-4">
          Where the town&apos;s money comes from — property taxes, state aid,
          local fees, and other sources.
        </p>
        <SummaryTiles tiles={revenueTiles} tooltips={categoryTooltips} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <PieChart
            data={revenueByCategory}
            title={`FY${revYears.currentYear} Revenue by Category`}
            townColor={town.primaryColor}
          />
        </div>
      </section>
    </div>
  );
}
