import type { ColumnMappingInput, NormalizedRow } from "@/types";
import { parseAmount } from "./format";

export function normalizeRows(
  rawRows: Record<string, string>[],
  mappings: ColumnMappingInput[]
): NormalizedRow[] {
  const fieldMap = new Map<string, string>();
  const fyColumns: { sourceColumn: string; fiscalYear: string; amountType: string }[] = [];
  let fiscalYearColumn: string | null = null;

  for (const m of mappings) {
    if (m.targetField === "skip") continue;
    if (m.targetField === "fyAmount" && m.fiscalYear) {
      fyColumns.push({
        sourceColumn: m.sourceColumn,
        fiscalYear: m.fiscalYear,
        amountType: m.amountType || "budget",
      });
    } else if (m.targetField === "fiscalYear") {
      fiscalYearColumn = m.sourceColumn;
    } else {
      fieldMap.set(m.targetField, m.sourceColumn);
    }
  }

  const get = (row: Record<string, string>, field: string): string | null => {
    const col = fieldMap.get(field);
    if (!col) return null;
    const val = row[col];
    return val && val.trim() ? val.trim() : null;
  };

  const results: NormalizedRow[] = [];

  for (const row of rawRows) {
    const baseRow = {
      fundCode: get(row, "fundCode"),
      fundName: get(row, "fundName"),
      department: get(row, "department"),
      departmentCode: get(row, "departmentCode"),
      functionArea: get(row, "functionArea"),
      lineItem: get(row, "lineItem"),
      objectCode: get(row, "objectCode"),
      category1: get(row, "category1"),
      category2: get(row, "category2"),
      purpose: get(row, "purpose"),
      fundingSource: get(row, "fundingSource"),
    };

    if (fyColumns.length > 0) {
      // Wide format: multiple FY columns → one row per FY
      for (const fyCol of fyColumns) {
        const amount = parseAmount(row[fyCol.sourceColumn]);
        if (amount === 0 && !row[fyCol.sourceColumn]) continue;
        results.push({
          ...baseRow,
          fiscalYear: fyCol.fiscalYear,
          amount,
          amountType: fyCol.amountType,
        });
      }
    } else if (fiscalYearColumn) {
      // Long format: one row per fiscal year, with the year, the amount and
      // (optionally) its type each in their own column
      const amountCol = fieldMap.get("amount") || findAmountColumn(row, fieldMap);
      const fiscalYear = normalizeFiscalYear(row[fiscalYearColumn]);
      const rawAmount = amountCol ? row[amountCol] : "";
      // A row without a year can't be placed on any chart, and without an
      // amount it carries no data
      if (!fiscalYear || !rawAmount?.trim()) continue;
      results.push({
        ...baseRow,
        fiscalYear,
        amount: parseAmount(rawAmount),
        amountType: normalizeAmountTypeLabel(get(row, "amountType")),
      });
    }
  }

  return results;
}

/**
 * Remove noise rows where every amount field is 0 or null.
 * Call after normalization to strip rows that carry no financial data.
 */
export function stripZeroAmountRows(rows: NormalizedRow[]): NormalizedRow[] {
  return rows.filter((row) => row.amount !== 0 && row.amount != null);
}

/**
 * "2026", "FY2026", "FY 2026" and "FY26" all become "2026", matching the
 * years wide-format headers produce. Anything else is kept as typed.
 */
export function normalizeFiscalYear(value: string | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;
  const match = text.match(/^(?:fy\s*)?(\d{4}|\d{2})$/i);
  if (!match) return text;
  return match[1].length === 2 ? `20${match[1]}` : match[1];
}

/**
 * Map a long-format Type cell ("Budget", "Adopted", "Actual", "Ending
 * Balance", ...) to the amount types wide-format headers produce. Rows with
 * no type are treated as budget, as before.
 */
export function normalizeAmountTypeLabel(value: string | null): string {
  const text = value?.trim().toLowerCase();
  if (!text) return "budget";
  if (text.includes("balance")) return "balance";
  if (text.includes("actual")) return "actual";
  if (/budget|approp|adopted/.test(text)) return "budget";
  return text;
}

/**
 * True when every non-empty value looks like an amount type, which is how a
 * long-format "Type" column is told apart from a category column also named
 * "Type".
 */
export function looksLikeAmountTypes(values: string[]): boolean {
  const filled = values.map((v) => v?.trim()).filter(Boolean);
  return (
    filled.length > 0 &&
    filled.every((v) => /budget|actual|balance|approp|adopted/i.test(v))
  );
}

function findAmountColumn(
  row: Record<string, string>,
  fieldMap: Map<string, string>
): string | null {
  const mapped = new Set(fieldMap.values());
  for (const key of Object.keys(row)) {
    if (mapped.has(key)) continue;
    if (/amount/i.test(key) || /budget/i.test(key) || /actual/i.test(key)) {
      return key;
    }
  }
  return null;
}
