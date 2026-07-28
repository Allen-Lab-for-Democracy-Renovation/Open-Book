export interface FinancialRow {
  fiscalYear: string;
  amountType: string;
  amount: number;
}

export interface FinancialColumn {
  key: string;
  fiscalYear: string;
  amountType: string;
  label: string;
}

export interface HierarchicalTableRow {
  id: string;
  cells: (string | number | null)[];
  isGroup?: boolean;
  isSubtotal?: boolean;
  depth?: number;
}

export interface ReserveRow extends FinancialRow {
  fundName?: string | null;
  lineItem?: string | null;
  department?: string | null;
  category1?: string | null;
  category2?: string | null;
}

export interface ReserveFundSeries {
  name: string;
  category: string;
  balances: Record<string, number>;
}

export interface ReserveSeries {
  years: string[];
  latestYear: string | null;
  previousYear: string | null;
  funds: ReserveFundSeries[];
  totalsByYear: Record<string, number>;
  categories: Record<string, number>;
  amountTypesByYear: Record<string, string>;
}

const DEFAULT_TYPE_ORDER = [
  "budget",
  "actual",
  "balance",
  "adopted",
  "recommended",
  "estimate",
  "request",
];

export const OPERATING_SERIES_PRIORITY = ["budget", "actual"];
export const RESERVE_SERIES_PRIORITY = ["balance", "actual", "budget"];

export function normalizeAmountType(amountType: string): string {
  return amountType.trim().toLowerCase() || "budget";
}

export function financialColumnKey(
  fiscalYear: string,
  amountType: string
): string {
  return `${fiscalYear}:${normalizeAmountType(amountType)}`;
}

function amountTypeLabel(amountType: string): string {
  return normalizeAmountType(amountType)
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function createFinancialColumn(
  fiscalYear: string,
  amountType: string
): FinancialColumn {
  const normalizedType = normalizeAmountType(amountType);
  return {
    key: financialColumnKey(fiscalYear, normalizedType),
    fiscalYear,
    amountType: normalizedType,
    label: `FY${fiscalYear} ${amountTypeLabel(normalizedType)}`,
  };
}

export function buildFinancialColumns<T extends FinancialRow>(
  rows: T[],
  typeOrder: string[] = DEFAULT_TYPE_ORDER
): FinancialColumn[] {
  const order = new Map(
    typeOrder.map((amountType, index) => [normalizeAmountType(amountType), index])
  );
  const columns = new Map<string, FinancialColumn>();

  for (const row of rows) {
    const column = createFinancialColumn(row.fiscalYear, row.amountType);
    columns.set(column.key, column);
  }

  return [...columns.values()].sort((a, b) => {
    const yearComparison = a.fiscalYear.localeCompare(b.fiscalYear, undefined, {
      numeric: true,
    });
    if (yearComparison !== 0) return yearComparison;

    const aOrder = order.get(a.amountType) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = order.get(b.amountType) ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.amountType.localeCompare(b.amountType);
  });
}

export function rowsForFinancialColumn<T extends FinancialRow>(
  rows: T[],
  column: FinancialColumn
): T[] {
  return rows.filter(
    (row) =>
      row.fiscalYear === column.fiscalYear &&
      normalizeAmountType(row.amountType) === column.amountType
  );
}

export function preferredRowsForYear<T extends FinancialRow>(
  rows: T[],
  fiscalYear: string,
  priority: string[] = OPERATING_SERIES_PRIORITY
): T[] {
  const yearRows = rows.filter((row) => row.fiscalYear === fiscalYear);

  for (const amountType of priority) {
    const normalizedType = normalizeAmountType(amountType);
    const matchingRows = yearRows.filter(
      (row) => normalizeAmountType(row.amountType) === normalizedType
    );
    if (matchingRows.length > 0) return matchingRows;
  }

  if (yearRows.length === 0) return [];
  const fallbackType = normalizeAmountType(yearRows[0].amountType);
  return yearRows.filter(
    (row) => normalizeAmountType(row.amountType) === fallbackType
  );
}

export function preferredColumnForYear<T extends FinancialRow>(
  rows: T[],
  fiscalYear: string,
  priority: string[] = OPERATING_SERIES_PRIORITY
): FinancialColumn | null {
  const preferredRows = preferredRowsForYear(rows, fiscalYear, priority);
  if (preferredRows.length === 0) return null;
  return createFinancialColumn(fiscalYear, preferredRows[0].amountType);
}

function inferredRowDepth(
  row: HierarchicalTableRow,
  activeAncestorCount: number
): number {
  if (row.depth !== undefined) return row.depth;
  if (row.isGroup) return 0;
  if (row.isSubtotal) return 1;
  return Math.max(1, activeAncestorCount);
}

export function filterHierarchicalRows<T extends HierarchicalTableRow>(
  rows: T[],
  query: string
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return rows;

  const included = new Set<number>();
  const ancestors: number[] = [];

  rows.forEach((row, index) => {
    const depth = inferredRowDepth(row, ancestors.length);
    ancestors.length = Math.min(ancestors.length, depth);
    const matches = row.cells.some(
      (cell) =>
        cell !== null &&
        cell.toString().toLowerCase().includes(normalizedQuery)
    );

    if (matches) {
      for (const ancestor of ancestors) included.add(ancestor);
      included.add(index);

      if (row.isGroup || row.isSubtotal) {
        for (let childIndex = index + 1; childIndex < rows.length; childIndex++) {
          const child = rows[childIndex];
          const childDepth = inferredRowDepth(child, depth + 1);
          if ((child.isGroup || child.isSubtotal) && childDepth <= depth) break;
          included.add(childIndex);
        }
      }
    }

    if (row.isGroup || row.isSubtotal) {
      ancestors[depth] = index;
      ancestors.length = depth + 1;
    }
  });

  return rows.filter((_, index) => included.has(index));
}

export function buildReserveSeries<T extends ReserveRow>(rows: T[]): ReserveSeries {
  const years = [...new Set(rows.map((row) => row.fiscalYear))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
  const funds = new Map<string, ReserveFundSeries>();
  const totalsByYear: Record<string, number> = {};
  const amountTypesByYear: Record<string, string> = {};

  for (const year of years) {
    const yearRows = preferredRowsForYear(rows, year, RESERVE_SERIES_PRIORITY);
    if (yearRows.length > 0) {
      amountTypesByYear[year] = normalizeAmountType(yearRows[0].amountType);
    }

    for (const row of yearRows) {
      const name =
        row.fundName || row.lineItem || row.department || "Unnamed Fund";
      const category = row.category1 || row.category2 || "Other";
      const fund = funds.get(name) ?? { name, category, balances: {} };

      if (row.category1 || row.category2) fund.category = category;
      fund.balances[year] = (fund.balances[year] || 0) + row.amount;
      funds.set(name, fund);
      totalsByYear[year] = (totalsByYear[year] || 0) + row.amount;
    }
  }

  const latestYear = years.at(-1) ?? null;
  const previousYear = years.length > 1 ? years.at(-2) ?? null : null;
  const sortedFunds = [...funds.values()].sort((a, b) => {
    if (!latestYear) return a.name.localeCompare(b.name);
    return (b.balances[latestYear] || 0) - (a.balances[latestYear] || 0);
  });
  const categories: Record<string, number> = {};

  if (latestYear) {
    for (const fund of sortedFunds) {
      categories[fund.category] =
        (categories[fund.category] || 0) + (fund.balances[latestYear] || 0);
    }
  }

  return {
    years,
    latestYear,
    previousYear,
    funds: sortedFunds,
    totalsByYear,
    categories,
    amountTypesByYear,
  };
}
