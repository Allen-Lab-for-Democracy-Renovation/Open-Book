import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  groupAndSum,
  toChartData,
  buildRevenueSummaryTiles,
  detectCurrentAndPreviousYear,
} from "@/lib/aggregator";
import {
  buildFinancialColumns,
  preferredColumnForYear,
  preferredRowsForYear,
  rowsForFinancialColumn,
} from "@/lib/financial-series";
import { calculateChange, formatCurrency, formatPercent } from "@/lib/format";
import SummaryTiles from "@/components/portal/SummaryTiles";
import PieChart from "@/components/portal/PieChart";
import QuickStats from "@/components/portal/QuickStats";
import TrendDrilldownChart from "@/components/portal/TrendDrilldownChart";
import BudgetTable from "@/components/portal/BudgetTable";
import ExportButton from "@/components/portal/ExportButton";

export default async function RevenuesPage({
  params,
}: {
  params: Promise<{ townSlug: string }>;
}) {
  const { townSlug } = await params;
  const town = await prisma.town.findUnique({ where: { slug: townSlug } });
  if (!town) return notFound();

  const [tooltipRows, allRows] = await Promise.all([
    prisma.tooltip.findMany({ where: { townId: town.id } }),
    prisma.budgetRow.findMany({
      where: { townId: town.id, dataCategory: "revenues" },
    }),
  ]);
  const categoryTooltips: Record<string, string> = {};
  const lineItemTooltips: Record<string, string> = {};
  for (const tooltip of tooltipRows) {
    if (tooltip.scope === "category") {
      categoryTooltips[tooltip.key] = tooltip.text;
    } else if (tooltip.scope === "line-item") {
      lineItemTooltips[tooltip.key] = tooltip.text;
    }
  }

  const { currentYear, previousYear, allYears } =
    detectCurrentAndPreviousYear(allRows);
  const current = preferredRowsForYear(allRows, currentYear);
  const previous = previousYear
    ? preferredRowsForYear(allRows, previousYear)
    : [];
  const hasPriorYear = previousYear !== null && previous.length > 0;
  const byCategory = toChartData(groupAndSum(current, "category1"));

  const yearRangeLabel = `FY${previousYear} – FY${currentYear}`;
  const totalChange = calculateChange(
    previous.reduce((sum, row) => sum + row.amount, 0),
    current.reduce((sum, row) => sum + row.amount, 0)
  );
  const tiles = [
    ...buildRevenueSummaryTiles(current, previous).slice(0, 2),
    ...(hasPriorYear
      ? [
          {
            label: `$ Change (${yearRangeLabel})`,
            value: formatCurrency(totalChange.absolute),
          },
          {
            label: `% Change (${yearRangeLabel})`,
            value: formatPercent(totalChange.percent),
          },
        ]
      : []),
  ];

  const years = allYears.length > 0 ? allYears : [currentYear];
  const categories = [...new Set(current.map((row) => row.category1 || "Other"))];
  const topCategories = categories.slice(0, 8);
  const trendSeries = topCategories.map((category) => ({
    label: category,
    data: years.map((year) =>
      preferredRowsForYear(allRows, year)
        .filter((row) => (row.category1 || "Other") === category)
        .reduce((sum, row) => sum + row.amount, 0)
    ),
  }));

  const subcategorySeriesByCategory: Record<
    string,
    { label: string; data: number[] }[]
  > = {};
  for (const category of topCategories) {
    const categoryRows = allRows.filter(
      (row) => (row.category1 || "Other") === category
    );
    const subcategories = [
      ...new Set(categoryRows.map((row) => row.category2 || "Other")),
    ];
    subcategorySeriesByCategory[category] = subcategories
      .slice(0, 8)
      .map((subcategory) => ({
        label: subcategory,
        data: years.map((year) =>
          preferredRowsForYear(categoryRows, year)
            .filter((row) => (row.category2 || "Other") === subcategory)
            .reduce((sum, row) => sum + row.amount, 0)
        ),
      }));
  }

  const revenueTotal = current.reduce((sum, row) => sum + row.amount, 0);
  const categoryEntries = Object.entries(
    groupAndSum(current, "category1")
  ).sort((a, b) => b[1] - a[1]);
  const quickStats = [
    {
      label: "Categories tracked",
      value: categoryEntries.length.toString(),
    },
    ...(categoryEntries[0]
      ? [
          {
            label: "Top source",
            value: categoryEntries[0][0],
            detail: `${((categoryEntries[0][1] / revenueTotal) * 100).toFixed(1)}% · ${formatCurrency(categoryEntries[0][1])}`,
          },
        ]
      : []),
    ...(categoryEntries[1]
      ? [
          {
            label: "Second largest",
            value: categoryEntries[1][0],
            detail: `${((categoryEntries[1][1] / revenueTotal) * 100).toFixed(1)}% · ${formatCurrency(categoryEntries[1][1])}`,
          },
        ]
      : []),
  ];

  const previousColumn = previousYear
    ? preferredColumnForYear(allRows, previousYear)
    : null;
  const currentColumn = preferredColumnForYear(allRows, currentYear);
  const comparisonConfig =
    hasPriorYear && previousColumn && currentColumn
      ? {
          fromKey: previousColumn.key,
          toKey: currentColumn.key,
          label: `% Change (${yearRangeLabel})`,
        }
      : undefined;

  type TableRow = {
    id: string;
    cells: (string | number | null)[];
    isGroup?: boolean;
    isSubtotal?: boolean;
    depth?: number;
  };

  const financialColumns = buildFinancialColumns(allRows, ["budget", "actual"]);
  const categoryTotalsByColumn = new Map<string, Map<string, number>>();
  const subcategoryTotalsByColumn = new Map<string, Map<string, number>>();
  const lineTotalsByColumn = new Map<string, Map<string, number>>();

  for (const column of financialColumns) {
    const columnRows = rowsForFinancialColumn(allRows, column);
    const categoryTotals = new Map<string, number>();
    const subcategoryTotals = new Map<string, number>();
    const lineTotals = new Map<string, number>();

    for (const row of columnRows) {
      const category = row.category1 || "Other";
      const subcategory = row.category2 || "Other";
      const subcategoryKey = `${category}|${subcategory}`;
      const lineKey = `${subcategoryKey}|${row.lineItem || ""}`;
      categoryTotals.set(
        category,
        (categoryTotals.get(category) || 0) + row.amount
      );
      subcategoryTotals.set(
        subcategoryKey,
        (subcategoryTotals.get(subcategoryKey) || 0) + row.amount
      );
      lineTotals.set(lineKey, (lineTotals.get(lineKey) || 0) + row.amount);
    }

    categoryTotalsByColumn.set(column.key, categoryTotals);
    subcategoryTotalsByColumn.set(column.key, subcategoryTotals);
    lineTotalsByColumn.set(column.key, lineTotals);
  }

  const tableRows: TableRow[] = [];
  const categoryGroups = new Map<string, typeof current>();
  for (const row of current) {
    const category = row.category1 || "Other";
    if (!categoryGroups.has(category)) categoryGroups.set(category, []);
    categoryGroups.get(category)!.push(row);
  }

  for (const [category, categoryRows] of categoryGroups) {
    tableRows.push({
      id: `category-${category}`,
      cells: [
        category,
        ...financialColumns.map(
          (column) => categoryTotalsByColumn.get(column.key)?.get(category) || 0
        ),
      ],
      isGroup: true,
      depth: 0,
    });

    const hasSubcategories = categoryRows.some((row) => row.category2);

    if (!hasSubcategories) {
      for (const row of categoryRows) {
        const lineKey = `${category}|Other|${row.lineItem || ""}`;
        tableRows.push({
          id: row.id,
          cells: [
            row.lineItem || category,
            ...financialColumns.map(
              (column) => lineTotalsByColumn.get(column.key)?.get(lineKey) || 0
            ),
          ],
          depth: 1,
        });
      }
      continue;
    }

    const subcategoryGroups = new Map<string, typeof categoryRows>();
    for (const row of categoryRows) {
      const subcategory = row.category2 || "Other";
      if (!subcategoryGroups.has(subcategory)) {
        subcategoryGroups.set(subcategory, []);
      }
      subcategoryGroups.get(subcategory)!.push(row);
    }

    for (const [subcategory, subcategoryRows] of subcategoryGroups) {
      const subcategoryKey = `${category}|${subcategory}`;
      tableRows.push({
        id: `subcategory-${category}-${subcategory}`,
        cells: [
          subcategory,
          ...financialColumns.map(
            (column) =>
              subcategoryTotalsByColumn
                .get(column.key)
                ?.get(subcategoryKey) || 0
          ),
        ],
        isSubtotal: true,
        depth: 1,
      });

      for (const row of subcategoryRows) {
        const lineKey = `${subcategoryKey}|${row.lineItem || ""}`;
        tableRows.push({
          id: row.id,
          cells: [
            row.lineItem || subcategory,
            ...financialColumns.map(
              (column) => lineTotalsByColumn.get(column.key)?.get(lineKey) || 0
            ),
          ],
          depth: 2,
        });
      }
    }
  }

  const exportData = current.map((row) => {
    const lineKey = `${row.category1 || "Other"}|${
      row.category2 || "Other"
    }|${row.lineItem || ""}`;
    const amountColumns: Record<string, string> = {};
    for (const column of financialColumns) {
      amountColumns[column.label] = formatCurrency(
        lineTotalsByColumn.get(column.key)?.get(lineKey) || 0
      );
    }
    return {
      Category: row.category1 || "",
      Subcategory: row.category2 || "",
      Description: row.lineItem || "",
      ...amountColumns,
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Revenues</h1>
        </div>
        <ExportButton
          data={exportData}
          filename={`${town.slug}-revenues-fy${currentYear}`}
        />
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <p className="text-sm text-emerald-800 leading-relaxed">
          <strong>How to read this page:</strong> The summary tiles show the
          big picture — total revenue, the top source, and how it changed
          from last year. Budget columns show expected revenue and Actual
          columns show recorded collections when published; they&apos;re kept
          separate so planned and recorded amounts are never added together.
          The charts below break revenue down visually, and further down is
          a searchable table with every source — look for the{" "}
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-[10px] font-bold">
            ?
          </span>{" "}
          icon next to items for a plain-language explanation.
          {hasPriorYear
            ? " The % Change column compares the latest adopted budget with the prior year's budget, or its actual amount when no budget was published."
            : ""}
        </p>
      </div>

      <SummaryTiles tiles={tiles} tooltips={categoryTooltips} />

      <section>
        <h2 className="text-lg font-medium">How Revenue Is Raised</h2>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          FY{currentYear} revenue by category
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PieChart
            data={byCategory}
            title={`FY${currentYear} Revenue by Category`}
            townColor={town.primaryColor}
          />
          <QuickStats title="Overview" stats={quickStats} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">How Revenue Has Changed</h2>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          Compare revenue by category across recent fiscal years
        </p>
        <TrendDrilldownChart
          title="Multi-Year Revenue Trend by Category"
          categories={years.map((year) => `FY${year}`)}
          topSeries={trendSeries}
          drilldownSeries={subcategorySeriesByCategory}
          drilldownLabel="Subcategory Revenue"
          drilldownHint="Click a bar segment to drill into subcategories"
        />
      </section>

      <section>
        <h2 className="text-lg font-medium">Revenue Detail Explorer</h2>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          Organized by category, subcategory, and source
        </p>
        <BudgetTable
          headers={["Source"]}
          rows={tableRows}
          searchPlaceholder="Search revenue sources..."
          categoryTooltips={categoryTooltips}
          lineItemTooltips={lineItemTooltips}
          seriesColumns={{
            columns: financialColumns.map(({ key, label }) => ({ key, label })),
            defaultSelectedKeys: financialColumns.map(({ key }) => key),
            comparison: comparisonConfig,
          }}
        />
      </section>
    </div>
  );
}
