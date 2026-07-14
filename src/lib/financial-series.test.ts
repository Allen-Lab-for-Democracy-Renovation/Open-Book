import assert from "node:assert/strict";
import test from "node:test";
import { detectColumns } from "./column-detector";
import {
  buildFinancialColumns,
  buildReserveSeries,
  filterHierarchicalRows,
  preferredRowsForYear,
} from "./financial-series";

test("financial columns keep Budget and Actual separate", () => {
  const rows = [
    { fiscalYear: "2025", amountType: "actual", amount: 90 },
    { fiscalYear: "2026", amountType: "actual", amount: 110 },
    { fiscalYear: "2026", amountType: "budget", amount: 100 },
  ];

  assert.deepEqual(
    buildFinancialColumns(rows).map(({ key, label }) => ({ key, label })),
    [
      { key: "2025:actual", label: "FY2025 Actual" },
      { key: "2026:budget", label: "FY2026 Budget" },
      { key: "2026:actual", label: "FY2026 Actual" },
    ]
  );
  assert.deepEqual(preferredRowsForYear(rows, "2026"), [rows[2]]);
});

test("hierarchical search retains matching branches and removes unrelated ones", () => {
  const rows = [
    { id: "safety", cells: ["Public Safety"], isGroup: true },
    { id: "police", cells: ["Police"], isSubtotal: true, depth: 1 },
    { id: "cruiser", cells: ["Cruiser fuel"], depth: 2 },
    { id: "fire", cells: ["Fire"], isSubtotal: true, depth: 1 },
    { id: "gear", cells: ["Protective gear"], depth: 2 },
    { id: "education", cells: ["Education"], isGroup: true },
    { id: "schools", cells: ["Schools"], isSubtotal: true, depth: 1 },
    { id: "books", cells: ["Textbooks"], depth: 2 },
  ];

  assert.deepEqual(
    filterHierarchicalRows(rows, "protective").map((row) => row.id),
    ["safety", "fire", "gear"]
  );
  assert.deepEqual(
    filterHierarchicalRows(rows, "Police").map((row) => row.id),
    ["safety", "police", "cruiser"]
  );
});

test("reserve series prefers balances and groups funds across years", () => {
  const series = buildReserveSeries([
    {
      fiscalYear: "2025",
      amountType: "balance",
      amount: 100,
      fundName: "General Stabilization",
      category1: "General",
    },
    {
      fiscalYear: "2026",
      amountType: "budget",
      amount: 999,
      fundName: "General Stabilization",
      category1: "General",
    },
    {
      fiscalYear: "2026",
      amountType: "balance",
      amount: 120,
      fundName: "General Stabilization",
      category1: "General",
    },
    {
      fiscalYear: "2026",
      amountType: "balance",
      amount: 80,
      fundName: "Capital Stabilization",
      category1: "Capital",
    },
  ]);

  assert.equal(series.latestYear, "2026");
  assert.equal(series.previousYear, "2025");
  assert.equal(series.totalsByYear["2026"], 200);
  assert.equal(series.amountTypesByYear["2026"], "balance");
  assert.deepEqual(series.categories, { General: 120, Capital: 80 });
});

test("reserve balance headers map to typed fiscal amount columns", () => {
  const mappings = detectColumns([
    "Fund Name",
    "Category",
    "FY2025 Balance",
    "2026 Ending Balance",
  ]);

  assert.deepEqual(
    mappings.map(({ targetField, fiscalYear, amountType }) => ({
      targetField,
      fiscalYear,
      amountType,
    })),
    [
      { targetField: "fundName", fiscalYear: undefined, amountType: undefined },
      { targetField: "category1", fiscalYear: undefined, amountType: undefined },
      { targetField: "fyAmount", fiscalYear: "2025", amountType: "balance" },
      { targetField: "fyAmount", fiscalYear: "2026", amountType: "balance" },
    ]
  );
});
