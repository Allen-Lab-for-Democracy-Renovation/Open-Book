import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { groupAndSum, toChartData, buildExpenseSummaryTiles, detectCurrentAndPreviousYear } from "@/lib/aggregator";
import { formatCurrency, calculateChange } from "@/lib/format";
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

  const { currentYear, previousYear: prevYear, allYears } = detectCurrentAndPreviousYear(allRows);

  const current = allRows.filter(
    (r) => r.fiscalYear === currentYear && r.amountType === "budget"
  );
  const prev = allRows.filter(
    (r) => r.fiscalYear === prevYear && (r.amountType === "budget" || r.amountType === "actual")
  );

  const tiles = buildExpenseSummaryTiles(current, prev);
  const byFunction = toChartData(groupAndSum(current, "functionArea"));

  const years = allYears.length > 0 ? allYears : [prevYear, currentYear];
  const functions = [...new Set(current.map((r) => r.functionArea || "Other"))];
  const trendSeries = functions.slice(0, 8).map((fn) => ({
    label: fn,
    data: years.map((y) =>
      allRows
        .filter(
          (r) => r.functionArea === fn && r.fiscalYear === y
        )
        .reduce((s, r) => s + r.amount, 0)
    ),
  }));

  // Build table rows grouped by function -> department
  type TableRow = {
    id: string;
    cells: (string | number | null)[];
    isGroup?: boolean;
    isSubtotal?: boolean;
    depth?: number;
  };

  const tableRows: TableRow[] = [];
  const functionGroups = new Map<string, typeof current>();

  for (const row of current) {
    const fn = row.functionArea || "Other";
    if (!functionGroups.has(fn)) functionGroups.set(fn, []);
    functionGroups.get(fn)!.push(row);
  }

  // Build prev lookup for change calc
  const prevByKey = new Map<string, number>();
  for (const row of prev) {
    const key = `${row.objectCode}-${row.lineItem}`;
    prevByKey.set(key, (prevByKey.get(key) || 0) + row.amount);
  }

  for (const [fn, fnRows] of functionGroups) {
    const fnTotal = fnRows.reduce((s, r) => s + r.amount, 0);
    tableRows.push({
      id: `fn-${fn}`,
      cells: [fn, "", fnTotal, null, null],
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
      const deptTotal = deptRows.reduce((s, r) => s + r.amount, 0);
      tableRows.push({
        id: `dept-${fn}-${dept}`,
        cells: [dept, "", deptTotal, null, null],
        isSubtotal: true,
        depth: 1,
      });

      for (const row of deptRows) {
        const key = `${row.objectCode}-${row.lineItem}`;
        const prevAmt = prevByKey.get(key) || 0;
        const change = calculateChange(prevAmt, row.amount);
        tableRows.push({
          id: row.id,
          cells: [
            row.lineItem || row.objectCode || "",
            row.objectCode || "",
            row.amount,
            change.absolute,
            change.percent,
          ],
          depth: 2,
        });
      }
    }
  }

  const exportData = current.map((r) => ({
    Function: r.functionArea || "",
    Department: r.department || "",
    "Line Item": r.lineItem || "",
    Account: r.objectCode || "",
    [`FY${currentYear} Budget`]: formatCurrency(r.amount),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-gray-500 mt-1">
            FY{currentYear} departmental spending
          </p>
        </div>
        <ExportButton data={exportData} filename={`${town.slug}-expenses-fy${currentYear}`} />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong>How to read this page:</strong>{" "}
          The summary tiles show the big picture — total spending,
          the largest area, and how it changed from last year. The charts
          below break spending down visually. Scroll further to see every
          line item in a searchable table. Look for the{" "}
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-[10px] font-bold">?</span>{" "}
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
        headers={["Description", "Account", `FY${currentYear}`, "$ Change", "% Change"]}
        rows={tableRows.map((r) => ({
          ...r,
          cells: r.cells.map((c, i) => {
            if (i === 4 && typeof c === "number") return `${c >= 0 ? "+" : ""}${c.toFixed(1)}%`;
            return c;
          }),
        }))}
        categoryTooltips={categoryTooltips}
        lineItemTooltips={lineItemTooltips}
      />
    </div>
  );
}
