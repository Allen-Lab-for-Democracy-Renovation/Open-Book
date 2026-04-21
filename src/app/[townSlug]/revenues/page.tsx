import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { groupAndSum, toChartData, buildRevenueSummaryTiles, detectCurrentAndPreviousYear } from "@/lib/aggregator";
import { formatCurrency } from "@/lib/format";
import SummaryTiles from "@/components/portal/SummaryTiles";
import PieChart from "@/components/portal/PieChart";
import BarChart from "@/components/portal/BarChart";
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
    where: { townId: town.id, dataCategory: "revenues" },
  });

  const { currentYear, previousYear, allYears } = detectCurrentAndPreviousYear(allRows);

  const current = allRows.filter(
    (r) => r.fiscalYear === currentYear && r.amountType === "budget"
  );
  const prev = allRows.filter(
    (r) => r.fiscalYear === previousYear && (r.amountType === "actual" || r.amountType === "budget")
  );

  const tiles = buildRevenueSummaryTiles(current, prev);
  const byCategory = toChartData(groupAndSum(current, "category1"));

  const years = allYears.length > 0 ? allYears : [previousYear, currentYear];
  const categories = [...new Set(current.map((r) => r.category1 || "Other"))];
  const trendSeries = categories.slice(0, 8).map((cat) => ({
    label: cat,
    data: years.map((y) =>
      allRows
        .filter((r) => r.category1 === cat && r.fiscalYear === y)
        .reduce((s, r) => s + r.amount, 0)
    ),
  }));

  // Table grouped by category -> subcategory
  type TableRow = {
    id: string;
    cells: (string | number | null)[];
    isGroup?: boolean;
    isSubtotal?: boolean;
    depth?: number;
  };

  const tableRows: TableRow[] = [];
  const catGroups = new Map<string, typeof current>();

  for (const row of current) {
    const cat = row.category1 || "Other";
    if (!catGroups.has(cat)) catGroups.set(cat, []);
    catGroups.get(cat)!.push(row);
  }

  for (const [cat, catRows] of catGroups) {
    const catTotal = catRows.reduce((s, r) => s + r.amount, 0);
    tableRows.push({
      id: `cat-${cat}`,
      cells: [cat, catTotal],
      isGroup: true,
    });

    for (const row of catRows) {
      tableRows.push({
        id: row.id,
        cells: [row.lineItem || row.category2 || "", row.amount],
        depth: 1,
      });
    }
  }

  const exportData = current.map((r) => ({
    Category: r.category1 || "",
    Subcategory: r.category2 || "",
    Description: r.lineItem || "",
    [`FY${currentYear} Budget`]: formatCurrency(r.amount),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Revenues</h1>
          <p className="text-gray-500 mt-1">FY{currentYear} revenue by source</p>
        </div>
        <ExportButton data={exportData} filename={`${town.slug}-revenues-fy${currentYear}`} />
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <p className="text-sm text-emerald-800 leading-relaxed">
          <strong>What are revenues?</strong>{" "}
          Revenue is the money the town collects to pay for services.
          The largest source is usually property taxes. State aid
          (Chapter 70 for schools, unrestricted government aid) is
          the second largest. Local receipts include things like motor
          vehicle excise tax, permits, and fees.
        </p>
      </div>

      <SummaryTiles tiles={tiles} tooltips={categoryTooltips} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PieChart
          data={byCategory}
          title={`FY${currentYear} Revenue by Category`}
          townColor={town.primaryColor}
        />
        <BarChart
          categories={years.map((y) => `FY${y}`)}
          series={trendSeries}
          title="Revenue Trend"
          stacked
        />
      </div>

      <BudgetTable
        headers={["Description", `FY${currentYear} Budget`]}
        rows={tableRows}
        categoryTooltips={categoryTooltips}
        lineItemTooltips={lineItemTooltips}
      />
    </div>
  );
}
