import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { groupAndSum, toChartData } from "@/lib/aggregator";
import { formatCurrency, abbreviateCurrency } from "@/lib/format";
import SummaryTiles from "@/components/portal/SummaryTiles";
import PieChart from "@/components/portal/PieChart";
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
    where: { townId: town.id, dataCategory: "capital" },
  });

  const years = [...new Set(allRows.map((r) => r.fiscalYear))].sort().reverse();
  const latestYear = years[0] || "2026";
  const latestRows = allRows.filter((r) => r.fiscalYear === latestYear);

  const totalAll = allRows.reduce((s, r) => s + r.amount, 0);
  const totalLatest = latestRows.reduce((s, r) => s + r.amount, 0);

  const byDept = groupAndSum(latestRows, "department");
  const topDept = Object.entries(byDept).sort((a, b) => b[1] - a[1])[0];

  const bySource = groupAndSum(latestRows, "fundingSource");
  const topSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0];

  const tiles = [
    { label: `FY${latestYear} Capital`, value: abbreviateCurrency(totalLatest) },
    { label: "All Years Total", value: abbreviateCurrency(totalAll) },
    { label: "Top Department", value: topDept ? topDept[0] : "N/A" },
    { label: "Top Funding Source", value: topSource ? topSource[0] : "N/A" },
  ];

  const deptChart = toChartData(byDept);

  // Table by fiscal year
  type TableRow = {
    id: string;
    cells: (string | number | null)[];
    isGroup?: boolean;
    isSubtotal?: boolean;
  };

  const tableRows: TableRow[] = [];
  for (const year of years) {
    const yearRows = allRows.filter((r) => r.fiscalYear === year);
    const yearTotal = yearRows.reduce((s, r) => s + r.amount, 0);
    tableRows.push({
      id: `year-${year}`,
      cells: [`FY${year}`, "", yearTotal, ""],
      isGroup: true,
    });
    for (const row of yearRows) {
      tableRows.push({
        id: row.id,
        cells: [
          row.department || "",
          row.purpose || "",
          row.amount,
          row.fundingSource || "",
        ],
      });
    }
  }

  const exportData = allRows.map((r) => ({
    "Fiscal Year": r.fiscalYear,
    Department: r.department || "",
    Purpose: r.purpose || "",
    Amount: formatCurrency(r.amount),
    "Funding Source": r.fundingSource || "",
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Capital Projects
          </h1>
          <p className="text-gray-500 mt-1">Capital spending by department</p>
        </div>
        <ExportButton data={exportData} filename={`${town.slug}-capital`} />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 leading-relaxed">
          <strong>What are capital projects?</strong>{" "}
          Capital projects are one-time purchases or investments — things
          like new fire trucks, road repaving, building repairs, and
          technology upgrades. Unlike day-to-day expenses, these are
          typically funded through free cash, borrowing, or special
          stabilization funds. The table below shows each project,
          its cost, and where the money comes from.
        </p>
      </div>

      <SummaryTiles tiles={tiles} tooltips={categoryTooltips} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PieChart
          data={deptChart}
          title={`FY${latestYear} Capital by Department`}
          townColor={town.primaryColor}
        />
      </div>

      <BudgetTable
        headers={["Department", "Purpose", "Amount", "Funding Source"]}
        rows={tableRows}
        categoryTooltips={categoryTooltips}
        lineItemTooltips={lineItemTooltips}
      />
    </div>
  );
}
