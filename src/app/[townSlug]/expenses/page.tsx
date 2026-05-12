import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  groupAndSum,
  toChartData,
  buildExpenseSummaryTiles,
  detectCurrentAndPreviousYear,
} from "@/lib/aggregator";
import { formatCurrency } from "@/lib/format";
import SummaryTiles from "@/components/portal/SummaryTiles";
import PieChart from "@/components/portal/PieChart";
import BarChart from "@/components/portal/BarChart";
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

  // Fetch tooltips
  const tooltipRows = await prisma.tooltip.findMany({
    where: { townId: town.id },
  });
  const categoryTooltips: Record<string, string> = {};
  const lineItemTooltips: Record<string, string> = {};
  for (const t of tooltipRows) {
    if (t.scope === "category") categoryTooltips[t.key] = t.text;
    else if (t.scope === "line-item") lineItemTooltips[t.key] = t.text;
  }

  const allRows = await prisma.budgetRow.findMany({
    where: { townId: town.id, dataCategory: "expenses" },
  });

  const {
    currentYear,
    previousYear: prevYear,
    allYears,
  } = detectCurrentAndPreviousYear(allRows);

  const current = allRows.filter(
    (r) => r.fiscalYear === currentYear && r.amountType === "budget"
  );
  const prev = allRows.filter(
    (r) =>
      r.fiscalYear === prevYear &&
      (r.amountType === "budget" || r.amountType === "actual")
  );

  const tiles = buildExpenseSummaryTiles(current, prev);
  const byFunction = toChartData(groupAndSum(current, "functionArea"));

  const years = allYears.length > 0 ? allYears : [prevYear, currentYear];
  const functions = [...new Set(current.map((r) => r.functionArea || "Other"))];
  const trendSeries = functions.slice(0, 8).map((fn) => ({
    label: fn,
    data: years.map((y) =>
      allRows
        .filter((r) => r.functionArea === fn && r.fiscalYear === y)
        .reduce((s, r) => s + r.amount, 0)
    ),
  }));

  // Build table rows grouped by function -> department, showing the most recent 3 fiscal years.
  type TableRow = {
    id: string;
    cells: (string | number | null)[];
    isGroup?: boolean;
    isSubtotal?: boolean;
    depth?: number;
  };

  // tableYears includes every fiscal year we have data for (ascending). The
  // BudgetTable defaults to showing the most recent 3 columns and exposes a
  // dropdown to toggle the rest when more than 3 years are available.
  const tableYears = allYears.length > 0 ? allYears : [currentYear];

  // For each year, aggregate amounts by function, department, and line key.
  // Current year uses "budget"; prior years fall back to budget/actual.
  const fnTotalsByYear = new Map<string, Map<string, number>>();
  const deptTotalsByYear = new Map<string, Map<string, number>>();
  const lineTotalsByYear = new Map<string, Map<string, number>>();

  for (const year of tableYears) {
    const yearRows = allRows.filter(
      (r) =>
        r.fiscalYear === year &&
        (year === currentYear
          ? r.amountType === "budget"
          : r.amountType === "budget" || r.amountType === "actual")
    );
    const fnMap = new Map<string, number>();
    const deptMap = new Map<string, number>();
    const lineMap = new Map<string, number>();
    for (const row of yearRows) {
      const fn = row.functionArea || "Other";
      const dept = row.department || "Other";
      const lineKey = `${fn}|${dept}|${row.objectCode || ""}|${
        row.lineItem || ""
      }`;
      fnMap.set(fn, (fnMap.get(fn) || 0) + row.amount);
      deptMap.set(
        `${fn}|${dept}`,
        (deptMap.get(`${fn}|${dept}`) || 0) + row.amount
      );
      lineMap.set(lineKey, (lineMap.get(lineKey) || 0) + row.amount);
    }
    fnTotalsByYear.set(year, fnMap);
    deptTotalsByYear.set(year, deptMap);
    lineTotalsByYear.set(year, lineMap);
  }

  const tableRows: TableRow[] = [];
  const functionGroups = new Map<string, typeof current>();

  for (const row of current) {
    const fn = row.functionArea || "Other";
    if (!functionGroups.has(fn)) functionGroups.set(fn, []);
    functionGroups.get(fn)!.push(row);
  }

  for (const [fn, fnRows] of functionGroups) {
    tableRows.push({
      id: `fn-${fn}`,
      cells: [
        fn,
        "",
        ...tableYears.map((y) => fnTotalsByYear.get(y)?.get(fn) || 0),
      ],
      isGroup: true,
    });

    // Group by department
    const deptGroups = new Map<string, typeof fnRows>();
    for (const row of fnRows) {
      const dept = row.department || "Other";
      if (!deptGroups.has(dept)) deptGroups.set(dept, []);
      deptGroups.get(dept)!.push(row);
    }

    for (const [dept, deptRows] of deptGroups) {
      tableRows.push({
        id: `dept-${fn}-${dept}`,
        cells: [
          dept,
          "",
          ...tableYears.map(
            (y) => deptTotalsByYear.get(y)?.get(`${fn}|${dept}`) || 0
          ),
        ],
        isSubtotal: true,
        depth: 1,
      });

      for (const row of deptRows) {
        const lineKey = `${fn}|${dept}|${row.objectCode || ""}|${
          row.lineItem || ""
        }`;
        tableRows.push({
          id: row.id,
          cells: [
            row.lineItem || row.objectCode || "",
            row.objectCode || "",
            ...tableYears.map(
              (y) => lineTotalsByYear.get(y)?.get(lineKey) || 0
            ),
          ],
          depth: 2,
        });
      }
    }
  }

  const exportData = current.map((r) => {
    const lineKey = `${r.functionArea || "Other"}|${r.department || "Other"}|${
      r.objectCode || ""
    }|${r.lineItem || ""}`;
    const yearCols: Record<string, string> = {};
    for (const y of tableYears) {
      yearCols[`FY${y}`] = formatCurrency(
        lineTotalsByYear.get(y)?.get(lineKey) || 0
      );
    }
    return {
      Function: r.functionArea || "",
      Department: r.department || "",
      "Line Item": r.lineItem || "",
      Account: r.objectCode || "",
      ...yearCols,
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-gray-500 mt-1">Yearly departmental spending</p>
        </div>
        <ExportButton
          data={exportData}
          filename={`${town.slug}-expenses-fy${currentYear}`}
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong>How to read this page:</strong> The summary tiles show the big
          picture — total spending, the largest area, and how it changed from
          last year. The charts below break spending down visually. Scroll
          further to see every line item in a searchable table. Look for the{" "}
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-[10px] font-bold">
            ?
          </span>{" "}
          icon next to items — hover or tap it for a plain-language explanation.
        </p>
      </div>

      <SummaryTiles tiles={tiles} tooltips={categoryTooltips} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PieChart
          data={byFunction}
          title={`FY${currentYear} Expenses by Function`}
          townColor={town.primaryColor}
        />
        <BarChart
          categories={years.map((y) => `FY${y}`)}
          series={trendSeries}
          title="Expense Trend by Function"
          stacked
        />
      </div>

      <BudgetTable
        headers={["Description", "Account"]}
        rows={tableRows}
        categoryTooltips={categoryTooltips}
        lineItemTooltips={lineItemTooltips}
        yearColumns={{ years: tableYears }}
      />
    </div>
  );
}
