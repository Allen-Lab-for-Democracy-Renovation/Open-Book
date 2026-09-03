import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { groupAndSum, toChartData, detectCurrentAndPreviousYear } from "@/lib/aggregator";
import { buildReserveSeries, preferredRowsForYear } from "@/lib/financial-series";
import { abbreviateCurrency, formatCurrency } from "@/lib/format";
import PieChart from "@/components/portal/PieChart";

function AmountTiles({
  items,
  color,
}: {
  items: [string, number][];
  color: string;
}) {
  return (
    <div className="space-y-3">
      {items.map(([label, amount]) => (
        <div
          key={label}
          className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <p className="text-sm font-medium text-gray-700 truncate">
              {label}
            </p>
          </div>
          <p className="text-lg font-bold text-gray-900 shrink-0">
            {formatCurrency(amount)}
          </p>
        </div>
      ))}
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  subtext,
  bigNumber,
  bigNumberLabel,
  ctaLabel,
  ctaHref,
  color,
}: {
  eyebrow: string;
  title: string;
  subtext: string;
  bigNumber: string;
  bigNumberLabel: string;
  ctaLabel: string;
  ctaHref: string;
  color: string;
}) {
  return (
    <div>
      <p
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color }}
      >
        {eyebrow}
      </p>
      <h2 className="text-3xl font-bold text-gray-900 tracking-tight mt-2 mb-4">
        {title}
      </h2>
      <p className="text-gray-600 leading-relaxed mb-6 max-w-md">{subtext}</p>
      <div className="border-l-4 pl-4 mb-6" style={{ borderColor: color }}>
        <p className="text-3xl font-bold text-gray-900">{bigNumber}</p>
        <p className="text-xs uppercase tracking-wide text-gray-500 mt-1">
          {bigNumberLabel}
        </p>
      </div>
      <Link
        href={ctaHref}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        style={{ backgroundColor: color }}
      >
        {ctaLabel} →
      </Link>
    </div>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ townSlug: string }>;
}) {
  const { townSlug } = await params;
  const town = await prisma.town.findUnique({ where: { slug: townSlug } });
  if (!town) return notFound();

  const [expenseRows, revenueRows, capitalRows, reserveRows] = await Promise.all([
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

  const hasAnyData =
    expenseRows.length > 0 ||
    revenueRows.length > 0 ||
    capitalRows.length > 0 ||
    reserveRows.length > 0;

  if (!hasAnyData) {
    return (
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
        <section
          className="px-4 sm:px-6 lg:px-8 py-24"
          style={{
            background: `linear-gradient(135deg, ${town.primaryColor}, #111827)`,
          }}
        >
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
              A Clearer View of {town.name}&apos;s Finances.
            </h1>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
              This budget portal is being set up. Once {town.name} publishes
              budget data, expenses, revenues, and capital investments will
              appear here.
            </p>
            {town.contactEmail && (
              <p className="text-white/60 text-sm mt-6">
                Questions in the meantime? Contact{" "}
                <a
                  href={`mailto:${town.contactEmail}`}
                  className="underline"
                >
                  {town.contactEmail}
                </a>
                .
              </p>
            )}
          </div>
        </section>
      </div>
    );
  }

  const { currentYear } = detectCurrentAndPreviousYear(expenseRows);
  const currentExpenses = preferredRowsForYear(expenseRows, currentYear);
  const expenseByFunction = toChartData(
    groupAndSum(currentExpenses, "functionArea")
  );
  const expenseTotal = currentExpenses.reduce(
    (sum, row) => sum + row.amount,
    0
  );
  const topExpenseFunction = Object.entries(
    groupAndSum(currentExpenses, "functionArea")
  ).sort((a, b) => b[1] - a[1])[0];
  const topExpensePct = topExpenseFunction
    ? (topExpenseFunction[1] / expenseTotal) * 100
    : 0;

  const revenueYears = detectCurrentAndPreviousYear(revenueRows);
  const currentRevenues = preferredRowsForYear(
    revenueRows,
    revenueYears.currentYear
  );
  const revenueTotal = currentRevenues.reduce(
    (sum, row) => sum + row.amount,
    0
  );
  const revenueByCategory = toChartData(
    groupAndSum(currentRevenues, "category1")
  );
  const topRevenueCategories = Object.entries(
    groupAndSum(currentRevenues, "category1")
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const topRevenuePct = topRevenueCategories[0]
    ? (topRevenueCategories[0][1] / revenueTotal) * 100
    : 0;

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
  const topCapitalDepartments = Object.entries(
    groupAndSum(latestCapitalRows, "department")
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const reserveSeries = buildReserveSeries(reserveRows);
  const latestReserveYear = reserveSeries.latestYear;
  const latestReserveTotal = latestReserveYear
    ? reserveSeries.totalsByYear[latestReserveYear] || 0
    : 0;
  const topReserveFunds = reserveSeries.funds
    .slice(0, 4)
    .map(
      (fund) =>
        [fund.name, fund.balances[latestReserveYear || ""] || 0] as [
          string,
          number,
        ]
    );

  const heroYear = expenseRows.length > 0
    ? currentYear
    : revenueRows.length > 0
      ? revenueYears.currentYear
      : latestCapitalYear || latestReserveYear || currentYear;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
      <section
        className="px-4 sm:px-6 lg:px-8 py-16"
        style={{
          background: `linear-gradient(135deg, ${town.primaryColor}, #111827)`,
        }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
              A Clearer View of {town.name}&apos;s Finances.
            </h1>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-6 max-w-xl">
              OpenBook makes {town.name}&apos;s budget, revenues, and capital
              investments understandable and accessible to every resident.
            </p>
            <Link
              href={`/${town.slug}/expenses`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Explore FY{heroYear} Budget →
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-white/60 mb-4">
              FY{heroYear} at a Glance
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wide">
                  Operating Budget
                </p>
                <p className="text-xl font-bold text-white mt-0.5">
                  {abbreviateCurrency(expenseTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wide">
                  Total Revenue
                </p>
                <p className="text-xl font-bold text-white mt-0.5">
                  {abbreviateCurrency(revenueTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wide">
                  Capital Investment
                </p>
                <p className="text-xl font-bold text-white mt-0.5">
                  {latestCapitalYear ? abbreviateCurrency(latestCapitalTotal) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wide">
                  Expense Line Items
                </p>
                <p className="text-xl font-bold text-white mt-0.5">
                  {currentExpenses.length.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="[&>section:nth-child(odd)]:bg-white [&>section:nth-child(even)]:bg-gray-50">
        {currentExpenses.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <SectionIntro
                eyebrow="Expenses"
                title={`Where ${town.name} Invests`}
                subtext={
                  topExpenseFunction
                    ? `${topExpenseFunction[0]} represents the largest area of spending at ${topExpensePct.toFixed(1)}% of the total budget. Every dollar is appropriated through the annual budget process.`
                    : "Every dollar is appropriated through the annual budget process."
                }
                bigNumber={abbreviateCurrency(expenseTotal)}
                bigNumberLabel={`Total FY${currentYear} Operating Budget`}
                ctaLabel="Explore Expenses"
                ctaHref={`/${town.slug}/expenses`}
                color={town.primaryColor}
              />
              <PieChart
                data={expenseByFunction}
                title={`FY${currentYear} Expenses by Function`}
                townColor={town.primaryColor}
              />
            </div>
          </section>
        )}

        {currentRevenues.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <SectionIntro
                eyebrow="Revenues"
                title={`How ${town.name} is Funded`}
                subtext={
                  topRevenueCategories[0]
                    ? `${topRevenueCategories[0][0]} is the largest source of funding at ${topRevenuePct.toFixed(1)}% of total revenue, alongside state aid and local receipts.`
                    : `Taxes, state aid, local receipts, and other sources fund ${town.name}'s operations.`
                }
                bigNumber={abbreviateCurrency(revenueTotal)}
                bigNumberLabel={`Total FY${revenueYears.currentYear} Revenue`}
                ctaLabel="Explore Revenues"
                ctaHref={`/${town.slug}/revenues`}
                color={town.primaryColor}
              />
              <PieChart
                data={revenueByCategory}
                title={`FY${revenueYears.currentYear} Revenue by Category`}
                townColor={town.primaryColor}
              />
            </div>
          </section>
        )}

        {latestCapitalYear && (
          <section className="px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <SectionIntro
                eyebrow="Capital Plan"
                title={`Building ${town.name}'s Future`}
                subtext={`Capital funds invest in roads, facilities, equipment, and infrastructure that will serve ${town.name} for years to come.`}
                bigNumber={abbreviateCurrency(latestCapitalTotal)}
                bigNumberLabel={`FY${latestCapitalYear} Capital Investment`}
                ctaLabel="Explore Capital Plan"
                ctaHref={`/${town.slug}/capital`}
                color={town.primaryColor}
              />
              <AmountTiles items={topCapitalDepartments} color={town.primaryColor} />
            </div>
          </section>
        )}

        {latestReserveYear && (
          <section className="px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <SectionIntro
                eyebrow="Reserves"
                title={`Protecting ${town.name}'s Future`}
                subtext={`Reserve and stabilization funds help ${town.name} respond to unexpected costs, plan capital investments, and reduce reliance on short-term borrowing.`}
                bigNumber={abbreviateCurrency(latestReserveTotal)}
                bigNumberLabel={`FY${latestReserveYear} Total Reserves`}
                ctaLabel="Explore Reserves"
                ctaHref={`/${town.slug}/reserves`}
                color={town.primaryColor}
              />
              <AmountTiles items={topReserveFunds} color={town.primaryColor} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
