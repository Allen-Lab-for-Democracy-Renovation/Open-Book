import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { groupAndSum, toChartData } from "@/lib/aggregator";
import { formatCurrency, abbreviateCurrency } from "@/lib/format";
import SummaryTiles from "@/components/portal/SummaryTiles";
import BarChart from "@/components/portal/BarChart";
import BreakdownToggle from "@/components/portal/BreakdownToggle";
import BudgetTable from "@/components/portal/BudgetTable";
import ExportButton from "@/components/portal/ExportButton";

export default async function CapitalPage({
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
      where: { townId: town.id, dataCategory: "capital" },
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

  const yearsAscending = [...new Set(allRows.map((row) => row.fiscalYear))].sort(
    (a, b) => a.localeCompare(b, undefined, { numeric: true })
  );
  const yearsDescending = [...yearsAscending].reverse();
  const latestYear = yearsDescending[0] || "2026";
  const latestRows = allRows.filter((row) => row.fiscalYear === latestYear);
  const totalAll = allRows.reduce((sum, row) => sum + row.amount, 0);
  const totalLatest = latestRows.reduce((sum, row) => sum + row.amount, 0);

  const byDepartment = groupAndSum(latestRows, "department");
  const byFundingSource = groupAndSum(latestRows, "fundingSource");
  const departmentChart = toChartData(byDepartment);
  const fundingChart = toChartData(byFundingSource);
  const topDepartment = departmentChart.labels[0];
  const topFundingSource = fundingChart.labels[0];

  const tiles = [
    { label: `FY${latestYear} Capital`, value: abbreviateCurrency(totalLatest) },
    { label: "Multi-Year Total", value: abbreviateCurrency(totalAll) },
    { label: "Top Department", value: topDepartment || "N/A" },
    { label: "Top Funding Source", value: topFundingSource || "N/A" },
  ];

  const allDepartmentChart = toChartData(groupAndSum(allRows, "department"));
  const trendDepartments = allDepartmentChart.labels.slice(0, 8);
  const trendSeries = trendDepartments.map((department) => ({
    label: department,
    data: yearsAscending.map((year) =>
      allRows
        .filter(
          (row) =>
            row.fiscalYear === year &&
            (row.department || "Other") === department
        )
        .reduce((sum, row) => sum + row.amount, 0)
    ),
  }));

  type TableRow = {
    id: string;
    cells: (string | number | null)[];
    isGroup?: boolean;
    depth?: number;
  };
  const tableRows: TableRow[] = [];
  for (const year of yearsDescending) {
    const yearRows = allRows.filter((row) => row.fiscalYear === year);
    const yearTotal = yearRows.reduce((sum, row) => sum + row.amount, 0);
    tableRows.push({
      id: `year-${year}`,
      cells: [`FY${year}`, "", yearTotal, ""],
      isGroup: true,
      depth: 0,
    });
    for (const row of yearRows.sort((a, b) => b.amount - a.amount)) {
      tableRows.push({
        id: row.id,
        cells: [
          row.department || "",
          row.purpose || "",
          row.amount,
          row.fundingSource || "",
        ],
        depth: 1,
      });
    }
  }

  const exportData = allRows.map((row) => ({
    "Fiscal Year": row.fiscalYear,
    Department: row.department || "",
    Purpose: row.purpose || "",
    Amount: formatCurrency(row.amount),
    "Funding Source": row.fundingSource || "",
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Capital Projects
          </h1>
          <p className="text-gray-600 mt-1">
            {allRows.length} projects · {yearsAscending.length} fiscal years ·{" "}
            {abbreviateCurrency(totalAll)} multi-year total
          </p>
        </div>
        <ExportButton data={exportData} filename={`${town.slug}-capital`} />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 leading-relaxed">
          <strong>What are capital projects?</strong> Capital projects are
          one-time investments in equipment, roads, facilities, technology, and
          other long-lived assets. The views below show both who is investing
          the funds and how each project is financed.
        </p>
      </div>

      <SummaryTiles tiles={tiles} tooltips={categoryTooltips} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownToggle
          title="What the Town Is Investing In"
          subtitle={`FY${latestYear} capital investment`}
          primaryLabel="Department"
          primaryData={departmentChart}
          secondaryLabel="Funding"
          secondaryData={fundingChart}
          townColor={town.primaryColor}
        />
        <BarChart
          categories={yearsAscending.map((year) => `FY${year}`)}
          series={trendSeries}
          title="Multi-Year Capital Investment Plan"
          stacked
        />
      </div>

      <section>
        <h2 className="text-lg font-medium">Capital Project Portfolio</h2>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          Projects grouped by fiscal year
        </p>
        <BudgetTable
          headers={["Department", "Project", "Amount", "Funding Source"]}
          rows={tableRows}
          searchPlaceholder="Search capital projects..."
          categoryTooltips={categoryTooltips}
          lineItemTooltips={lineItemTooltips}
        />
      </section>
    </div>
  );
}
