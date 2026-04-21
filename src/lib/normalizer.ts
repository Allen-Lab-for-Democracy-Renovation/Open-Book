import type { ColumnMappingInput, NormalizedRow } from "@/types";
import { parseAmount } from "./format";

export function normalizeRows(
  rawRows: Record<string, string>[],
  mappings: ColumnMappingInput[]
): NormalizedRow[] {
  const fieldMap = new Map<string, string>();
  const fyColumns: { sourceColumn: string; fiscalYear: string; amountType: string }[] = [];
  let fiscalYearColumn: string | null = null;
  let amountColumn: string | null = null;

  for (const m of mappings) {
    if (m.targetField === "skip") continue;
    if (m.targetField === "fyAmount" && m.fiscalYear && m.amountType) {
      fyColumns.push({
        sourceColumn: m.sourceColumn,
        fiscalYear: m.fiscalYear,
        amountType: m.amountType,
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
      // Long format: fiscal year is a column, look for an amount column
      const amountCol = fieldMap.get("amount") || findAmountColumn(row, fieldMap);
      const fy = row[fiscalYearColumn]?.trim() || "unknown";
      const amount = amountCol ? parseAmount(row[amountCol]) : 0;
      results.push({
        ...baseRow,
        fiscalYear: fy,
        amount,
        amountType: "budget",
      });
    }
  }

  return results;
}

function findAmountColumn(
  row: Record<string, string>,
  fieldMap: Map<string, string>
): string | null {
  const mapped = new Set(fieldMap.values());
  for (const [key, value] of Object.entries(row)) {
    if (mapped.has(key)) continue;
    if (/amount/i.test(key) || /budget/i.test(key) || /actual/i.test(key)) {
      return key;
    }
  }
  return null;
}
