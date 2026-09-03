import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  groupAndSum,
  toChartData,
  buildExpenseSummaryTiles,
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

export default async function ExpensesPage({
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
      where: { townId: town.id, dataCategory: "expenses" },
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

  const {
    currentYear,
    previousYear: previousYear,
    allYears,
  } = detectCurrentAndPreviousYear(allRows);
  const current = preferredRowsForYear(allRows, currentYear);
  const previous = previousYear
    ? preferredRowsForYear(allRows, previousYear)
    : [];
  const hasPriorYear = previousYear !== null && previous.length > 0;
  const yearRangeLabel = `FY${previousYear} – FY${currentYear}`;
  const totalChange = calculateChange(
    previous.reduce((sum, row) => sum + row.amount, 0),
    current.reduce((sum, row) => sum + row.amount, 0)
  );
  const tiles = [
    ...buildExpenseSummaryTiles(current, previous).slice(0, 2),
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
  const byFunction = toChartData(groupAndSum(current, "functionArea"));

  const years = allYears.length > 0 ? allYears : [currentYear];
  const functions = [...new Set(current.map((row) => row.functionArea || "Other"))];
  const topFunctions = functions.slice(0, 8);
  const trendSeries = topFunctions.map((functionName) => ({
    label: functionName,
    data: years.map((year) =>
      preferredRowsForYear(allRows, year)
        .filter((row) => (row.functionArea || "Other") === functionName)
        .reduce((sum, row) => sum + row.amount, 0)
    ),
  }));

  const departmentSeriesByFunction: Record<
    string,
    { label: string; data: number[] }[]
  > = {};
  for (const functionName of topFunctions) {
    const functionRows = allRows.filter(
      (row) => (row.functionArea || "Other") === functionName
    );
    const departments = [
      ...new Set(functionRows.map((row) => row.department || "Other")),
    ];
    departmentSeriesByFunction[functionName] = departments
      .slice(0, 8)
      .map((department) => ({
        label: department,
        data: years.map((year) =>
          preferredRowsForYear(functionRows, year)
            .filter((row) => (row.department || "Other") === department)
            .reduce((sum, row) => sum + row.amount, 0)
        ),
      }));
  }

  const expenseTotal = current.reduce((sum, row) => sum + row.amount, 0);
  const functionEntries = Object.entries(
    groupAndSum(current, "functionArea")
  ).sort((a, b) => b[1] - a[1]);
  const quickStats = [
    {
      label: "Function areas tracked",
      value: functionEntries.length.toString(),
    },
    ...(functionEntries[0]
      ? [
          {
            label: "Largest function",
            value: functionEntries[0][0],
            detail: `${((functionEntries[0][1] / expenseTotal) * 100).toFixed(1)}% · ${formatCurrency(functionEntries[0][1])}`,
          },
        ]
      : []),
    ...(functionEntries[1]
      ? [
          {
            label: "Second largest",
            value: functionEntries[1][0],
            detail: `${((functionEntries[1][1] / expenseTotal) * 100).toFixed(1)}% · ${formatCurrency(functionEntries[1][1])}`,
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
          label: `% Change (FY${previousYear} – FY${currentYear})`,
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
  const functionTotalsByColumn = new Map<string, Map<string, number>>();
  const departmentTotalsByColumn = new Map<string, Map<string, number>>();
  const subcategoryTotalsByColumn = new Map<string, Map<string, number>>();
  const lineTotalsByColumn = new Map<string, Map<string, number>>();

  for (const column of financialColumns) {
    const columnRows = rowsForFinancialColumn(allRows, column);
    const functionTotals = new Map<string, number>();
    const departmentTotals = new Map<string, number>();
    const subcategoryTotals = new Map<string, number>();
    const lineTotals = new Map<string, number>();

    for (const row of columnRows) {
      const functionName = row.functionArea || "Other";
      const department = row.department || "Other";
      const departmentKey = `${functionName}|${department}`;
      const subcategoryKey = `${departmentKey}|${row.category2 || "Other"}`;
      const lineKey = `${subcategoryKey}|${row.objectCode || ""}|${
        row.lineItem || ""
      }`;
      functionTotals.set(
        functionName,
        (functionTotals.get(functionName) || 0) + row.amount
      );
      departmentTotals.set(
        departmentKey,
        (departmentTotals.get(departmentKey) || 0) + row.amount
      );
      subcategoryTotals.set(
        subcategoryKey,
        (subcategoryTotals.get(subcategoryKey) || 0) + row.amount
      );
      lineTotals.set(lineKey, (lineTotals.get(lineKey) || 0) + row.amount);
    }

    functionTotalsByColumn.set(column.key, functionTotals);
    departmentTotalsByColumn.set(column.key, departmentTotals);
    subcategoryTotalsByColumn.set(column.key, subcategoryTotals);
    lineTotalsByColumn.set(column.key, lineTotals);
  }

  const tableRows: TableRow[] = [];
  const functionGroups = new Map<string, typeof current>();
  for (const row of current) {
    const functionName = row.functionArea || "Other";
    if (!functionGroups.has(functionName)) functionGroups.set(functionName, []);
    functionGroups.get(functionName)!.push(row);
  }

  for (const [functionName, functionRows] of functionGroups) {
    tableRows.push({
      id: `function-${functionName}`,
      cells: [
        functionName,
        "",
        ...financialColumns.map(
          (column) =>
            functionTotalsByColumn.get(column.key)?.get(functionName) || 0
        ),
      ],
      isGroup: true,
      depth: 0,
    });

    const departmentGroups = new Map<string, typeof functionRows>();
    for (const row of functionRows) {
      const department = row.department || "Other";
      if (!departmentGroups.has(department)) departmentGroups.set(department, []);
      departmentGroups.get(department)!.push(row);
    }

    for (const [department, departmentRows] of departmentGroups) {
      const departmentKey = `${functionName}|${department}`;
      tableRows.push({
        id: `department-${functionName}-${department}`,
        cells: [
          department,
          "",
          ...financialColumns.map(
            (column) =>
              departmentTotalsByColumn
                .get(column.key)
                ?.get(departmentKey) || 0
          ),
        ],
        isSubtotal: true,
        depth: 1,
      });

      const hasSubcategories = departmentRows.some((row) => row.category2);

      if (!hasSubcategories) {
        for (const row of departmentRows) {
          const lineKey = `${departmentKey}|Other|${row.objectCode || ""}|${
            row.lineItem || ""
          }`;
          tableRows.push({
            id: row.id,
            cells: [
              row.lineItem || row.objectCode || "",
              row.objectCode || "",
              ...financialColumns.map(
                (column) => lineTotalsByColumn.get(column.key)?.get(lineKey) || 0
              ),
            ],
            depth: 2,
          });
        }
        continue;
      }

      const subcategoryGroups = new Map<string, typeof departmentRows>();
      for (const row of departmentRows) {
        const subcategory = row.category2 || "Other";
        if (!subcategoryGroups.has(subcategory)) {
          subcategoryGroups.set(subcategory, []);
        }
        subcategoryGroups.get(subcategory)!.push(row);
      }

      for (const [subcategory, subcategoryRows] of subcategoryGroups) {
        const subcategoryKey = `${departmentKey}|${subcategory}`;
        tableRows.push({
          id: `subcategory-${functionName}-${department}-${subcategory}`,
          cells: [
            subcategory,
            "",
            ...financialColumns.map(
              (column) =>
                subcategoryTotalsByColumn
                  .get(column.key)
                  ?.get(subcategoryKey) || 0
            ),
          ],
          isSubtotal: true,
          depth: 2,
        });

        for (const row of subcategoryRows) {
          const lineKey = `${subcategoryKey}|${row.objectCode || ""}|${
            row.lineItem || ""
          }`;
          tableRows.push({
            id: row.id,
            cells: [
              row.lineItem || row.objectCode || "",
              row.objectCode || "",
              ...financialColumns.map(
                (column) => lineTotalsByColumn.get(column.key)?.get(lineKey) || 0
              ),
            ],
            depth: 3,
          });
        }
      }
    }
  }

  const exportData = current.map((row) => {
    const lineKey = `${row.functionArea || "Other"}|${
      row.department || "Other"
    }|${row.category2 || "Other"}|${row.objectCode || ""}|${
      row.lineItem || ""
    }`;
    const amountColumns: Record<string, string> = {};
    for (const column of financialColumns) {
      amountColumns[column.label] = formatCurrency(
        lineTotalsByColumn.get(column.key)?.get(lineKey) || 0
      );
    }
    return {
      Function: row.functionArea || "",
      Department: row.department || "",
      "Sub Category": row.category2 || "",
      "Line Item": row.lineItem || "",
      Account: row.objectCode || "",
      ...amountColumns,
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
        </div>
        <ExportButton
          data={exportData}
          filename={`${town.slug}-expenses-fy${currentYear}`}
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong>How to read this page:</strong> The summary tiles show the
          big picture — total spending, the largest area, and how it changed
          from last year. Budget columns show adopted appropriations and
          Actual columns show recorded spending when published; they&apos;re
          kept separate so planned and recorded amounts are never added
          together. The charts below break spending down visually, and
          further down is a searchable table with every line item — look for
          the{" "}
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
        <h2 className="text-lg font-medium">How the Budget Is Allocated</h2>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          FY{currentYear} spending by function
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PieChart
            data={byFunction}
            title={`FY${currentYear} Expenses by Function`}
            townColor={town.primaryColor}
          />
          <QuickStats title="Overview" stats={quickStats} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">How Spending Has Changed</h2>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          Compare operating budget allocations across recent fiscal years
        </p>
        <TrendDrilldownChart
          title="Multi-Year Expense Trend by Function"
          categories={years.map((year) => `FY${year}`)}
          topSeries={trendSeries}
          drilldownSeries={departmentSeriesByFunction}
          drilldownLabel="Department Spending"
          drilldownHint="Click a bar segment to drill into departments"
        />
      </section>

      <section>
        <h2 className="text-lg font-medium">Expense Detail Explorer</h2>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          Organized by function area, department, and account
        </p>
        <BudgetTable
          headers={["Description", "Account"]}
          rows={tableRows}
          searchPlaceholder="Search accounts and line items..."
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
