import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { groupAndSum, toChartData } from "@/lib/aggregator";
import { preferredRowsForYear } from "@/lib/financial-series";
import {
  calculateChange,
  formatCurrency,
  formatPercent,
  abbreviateCurrency,
} from "@/lib/format";
import SummaryTiles from "@/components/portal/SummaryTiles";
import PieChart from "@/components/portal/PieChart";
import QuickStats from "@/components/portal/QuickStats";
import TrendDrilldownChart from "@/components/portal/TrendDrilldownChart";
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
  const currentYear = yearsDescending[0] || "2026";
  const previousYear = yearsDescending[1] ?? null;
  const hasPriorYear = previousYear !== null;

  const current = preferredRowsForYear(allRows, currentYear);
  const previous = previousYear ? preferredRowsForYear(allRows, previousYear) : [];
  const totalCurrent = current.reduce((sum, row) => sum + row.amount, 0);
  const totalAll = yearsAscending
    .flatMap((year) => preferredRowsForYear(allRows, year))
    .reduce((sum, row) => sum + row.amount, 0);

  const byDepartment = groupAndSum(current, "department");
  const byFundingSource = groupAndSum(current, "fundingSource");
  const departmentChart = toChartData(byDepartment);
  const topDepartment = departmentChart.labels[0];
  const topFundingSource = toChartData(byFundingSource).labels[0];

  const yearRangeLabel = `FY${previousYear} – FY${currentYear}`;
  const totalChange = calculateChange(
    previous.reduce((sum, row) => sum + row.amount, 0),
    totalCurrent
  );
  const yearsSpanLabel =
    yearsAscending.length > 1
      ? `${yearsAscending.length} fiscal years (FY${yearsAscending[0]} – FY${yearsAscending[yearsAscending.length - 1]})`
      : `${yearsAscending.length} fiscal year (FY${yearsAscending[0]})`;

  const tiles = [
    {
      label: `FY${currentYear} Capital Investment`,
      value: abbreviateCurrency(totalCurrent),
    },
    {
      label: "Multi-Year Capital Plan",
      value: abbreviateCurrency(totalAll),
      change: yearsSpanLabel,
    },
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
      : [
          { label: "Top Department", value: topDepartment || "N/A" },
          { label: "Top Funding Source", value: topFundingSource || "N/A" },
        ]),
  ];

  const departmentEntries = Object.entries(byDepartment).sort(
    (a, b) => b[1] - a[1]
  );
  const quickStats = [
    { label: "Departments funded", value: departmentEntries.length.toString() },
    ...(departmentEntries[0]
      ? [
          {
            label: "Top department",
            value: departmentEntries[0][0],
            detail: `${((departmentEntries[0][1] / totalCurrent) * 100).toFixed(1)}% · ${formatCurrency(departmentEntries[0][1])}`,
          },
        ]
      : []),
    ...(departmentEntries[1]
      ? [
          {
            label: "Second largest",
            value: departmentEntries[1][0],
            detail: `${((departmentEntries[1][1] / totalCurrent) * 100).toFixed(1)}% · ${formatCurrency(departmentEntries[1][1])}`,
          },
        ]
      : []),
  ];

  const fundingEntries = Object.entries(byFundingSource).sort(
    (a, b) => b[1] - a[1]
  );
  const fundingQuickStats = [
    { label: "Funding sources used", value: fundingEntries.length.toString() },
    ...(fundingEntries[0]
      ? [
          {
            label: "Top funding source",
            value: fundingEntries[0][0],
            detail: `${((fundingEntries[0][1] / totalCurrent) * 100).toFixed(1)}% · ${formatCurrency(fundingEntries[0][1])}`,
          },
        ]
      : []),
    ...(fundingEntries[1]
      ? [
          {
            label: "Second largest",
            value: fundingEntries[1][0],
            detail: `${((fundingEntries[1][1] / totalCurrent) * 100).toFixed(1)}% · ${formatCurrency(fundingEntries[1][1])}`,
          },
        ]
      : []),
  ];

  const allDepartmentChart = toChartData(groupAndSum(allRows, "department"));
  const trendDepartments = allDepartmentChart.labels.slice(0, 8);
  const trendSeries = trendDepartments.map((department) => ({
    label: department,
    data: yearsAscending.map((year) =>
      preferredRowsForYear(allRows, year)
        .filter((row) => (row.department || "Other") === department)
        .reduce((sum, row) => sum + row.amount, 0)
    ),
  }));

  const projectSeriesByDepartment: Record<
    string,
    { label: string; data: number[] }[]
  > = {};
  for (const department of trendDepartments) {
    const departmentRows = allRows.filter(
      (row) => (row.department || "Other") === department
    );
    const projects = [
      ...new Set(departmentRows.map((row) => row.purpose || "Unnamed Project")),
    ];
    projectSeriesByDepartment[department] = projects.slice(0, 8).map((project) => ({
      label: project,
      data: yearsAscending.map((year) =>
        preferredRowsForYear(departmentRows, year)
          .filter((row) => (row.purpose || "Unnamed Project") === project)
          .reduce((sum, row) => sum + row.amount, 0)
      ),
    }));
  }

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
    for (const row of [...yearRows].sort((a, b) => b.amount - a.amount)) {
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
        </div>
        <ExportButton data={exportData} filename={`${town.slug}-capital`} />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 leading-relaxed">
          <strong>How to read this page:</strong> The summary tiles show the
          big picture — this year&apos;s capital investment, the multi-year
          plan total, and how it changed from last year. Capital projects are
          one-time investments in equipment, roads, facilities, technology,
          and other long-lived assets. The charts below show who is investing
          the funds and how projects are financed, and further down is a
          searchable table grouped by fiscal year — look for the{" "}
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-[10px] font-bold">
            ?
          </span>{" "}
          icon next to items for a plain-language explanation.
        </p>
      </div>

      <SummaryTiles tiles={tiles} tooltips={categoryTooltips} />

      <section>
        <h2 className="text-lg font-medium">What {town.name} Is Investing In</h2>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          FY{currentYear} capital investment by department
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PieChart
            data={departmentChart}
            title={`FY${currentYear} Capital by Department`}
            townColor={town.primaryColor}
          />
          <QuickStats title="Overview" stats={quickStats} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">How Capital Projects Are Funded</h2>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          FY{currentYear} funding sources
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-display font-medium text-gray-700 mb-4">
              How Capital Projects Are Funded
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Capital projects are typically funded through a mix of sources —
              borrowing (bonds and notes), free cash, capital stabilization
              funds, grants, and direct appropriations from the operating
              budget. The mix matters: borrowing spreads a project&apos;s cost
              over future years and adds debt service, while free cash and
              stabilization funds draw down reserves today. Which sources a
              project draws from affects both the municipality&apos;s debt
              levels and how much of its reserves are being used.
            </p>
          </div>
          <QuickStats title="Funding Sources" stats={fundingQuickStats} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">Multi-Year Capital Investment Plan</h2>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          Compare capital investment by department across recent fiscal years
        </p>
        <TrendDrilldownChart
          title="Multi-Year Capital Investment by Department"
          categories={yearsAscending.map((year) => `FY${year}`)}
          topSeries={trendSeries}
          drilldownSeries={projectSeriesByDepartment}
          drilldownLabel="Project Investment"
          drilldownHint="Click a bar segment to drill into projects"
        />
      </section>

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
