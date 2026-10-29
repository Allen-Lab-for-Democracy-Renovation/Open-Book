import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ParsedFile } from "@/types";

export function parseCSV(content: string): ParsedFile {
  if (!content.trim()) {
    throw new Error("CSV file is empty or contains only whitespace.");
  }

  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0) {
    const firstError = result.errors[0];
    throw new Error(
      `CSV parse error on row ${firstError.row ?? "?"}: ${firstError.message}`
    );
  }

  const headers = result.meta.fields || [];
  if (headers.length === 0) {
    throw new Error("No column headers found in CSV file.");
  }

  return {
    headers,
    rows: result.data,
  };
}

export function parseExcel(buffer: ArrayBuffer): ParsedFile {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  } catch {
    throw new Error("Could not read Excel file. It may be corrupted or in an unsupported format.");
  }

  if (workbook.SheetNames.length === 0) {
    throw new Error("Excel file has no sheets.");
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // Use each number's real value instead of its displayed text, so a cell's
  // number format can't change what's saved: "#,##0" would drop cents,
  // accounting format shows negatives as "(5,000)", and a fiscal year
  // formatted as a number would read "2,026.00". Date cells (typed "d"
  // because of cellDates) and text keep their displayed form.
  for (const [address, cell] of Object.entries(sheet)) {
    if (!address.startsWith("!") && cell.t === "n") cell.w = String(cell.v);
  }
  const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: "",
    raw: false,
  });

  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  if (headers.length === 0) {
    throw new Error("Excel sheet is empty or has no column headers.");
  }

  return {
    headers,
    rows: data,
  };
}

export function parseFile(
  content: string | ArrayBuffer,
  fileType: "csv" | "xlsx"
): ParsedFile {
  if (fileType === "csv") {
    return parseCSV(content as string);
  }
  return parseExcel(content as ArrayBuffer);
}

export function getFileType(fileName: string): "csv" | "xlsx" {
  return fileName.toLowerCase().endsWith(".xlsx") ? "xlsx" : "csv";
}

/**
 * Parse and clean an uploaded CSV or Excel file. Both the upload preview and
 * the mapping save use this, so the rows that get saved are exactly the rows
 * the admin previewed.
 */
export async function parseUploadedFile(file: File): Promise<ParsedFile> {
  const parsed =
    getFileType(file.name) === "xlsx"
      ? parseExcel(await file.arrayBuffer())
      : parseCSV(await file.text());
  return cleanRows(parsed);
}

// ---------------------------------------------------------------------------
// Row-cleaning utilities for non-standard municipal budget layouts
// ---------------------------------------------------------------------------

/**
 * Patterns that indicate a row is a title/preamble row sitting above the
 * actual data.  These are checked against cells that appear to be the only
 * non-empty value in the row (i.e. a "spanning" title cell).
 */
const TITLE_PATTERNS = [
  /\btown\s+of\b/i,
  /\bcity\s+of\b/i,
  /\bfy\s*20\d{2}\b/i,
  /\bbudget\b/i,
  /\bschedule\s+[a-z]/i,
];

/**
 * Keywords that — when they ARE the entire (trimmed, decoration-stripped)
 * cell value — indicate a subtotal / total row.
 *
 * We intentionally keep this list narrow so legitimate line items like
 * "Police Total Budget" are not caught.
 */
const TOTAL_KEYWORDS = new Set([
  "total",
  "totals",
  "subtotal",
  "sub-total",
  "grand total",
]);

/**
 * Strip decoration characters that municipal spreadsheets often use around
 * totals (asterisks, dashes, underscores, colons).
 */
function stripDecoration(value: string): string {
  return value.replace(/^[\s*_\-:]+|[\s*_\-:]+$/g, "").trim();
}

/**
 * Returns true when the cell text is *just* a total keyword, optionally
 * wrapped in decoration like "** TOTAL **" or "--- Subtotal ---".
 */
function isTotalLabel(cell: string): boolean {
  const stripped = stripDecoration(cell).toLowerCase();
  return TOTAL_KEYWORDS.has(stripped);
}

/**
 * Returns true when a row looks like a blank / separator row
 * (every cell is empty or whitespace-only).
 */
function isBlankRow(row: Record<string, string>): boolean {
  return Object.values(row).every((v) => !cellText(v));
}

/**
 * Trimmed text of a cell, or "" for anything that isn't a string. Parsers can
 * hand back non-string values (Papa Parse puts overflow cells in an array
 * under `__parsed_extra`), and the cleaning checks below must not crash on them.
 */
function cellText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Returns true when a row looks like a title/preamble row:
 * exactly one non-empty cell whose value matches a title pattern.
 */
function isTitleRow(row: Record<string, string>, columnCount: number): boolean {
  const nonEmpty = Object.values(row).map(cellText).filter(Boolean);
  // A title row typically has only 1 meaningful cell in a multi-column sheet
  if (nonEmpty.length !== 1 || columnCount < 2) return false;
  const cell = nonEmpty[0];
  return TITLE_PATTERNS.some((p) => p.test(cell));
}

/**
 * Returns true when the first text cell of the row is a total keyword.
 */
function isSubtotalRow(row: Record<string, string>): boolean {
  // Find the first non-empty cell value
  for (const value of Object.values(row)) {
    const trimmed = cellText(value);
    if (trimmed) {
      return isTotalLabel(trimmed);
    }
  }
  return false;
}

/**
 * Pre-process parsed rows to strip noise that is common in municipal
 * budget spreadsheets:
 *  - Title/preamble rows above the header
 *  - Blank/separator rows
 *  - Subtotal and total rows
 *
 * Call this after parsing but before column detection.
 */
export function cleanRows(parsed: ParsedFile): ParsedFile {
  const columnCount = parsed.headers.length;

  const cleaned = parsed.rows.filter((row) => {
    if (isBlankRow(row)) return false;
    if (isTitleRow(row, columnCount)) return false;
    if (isSubtotalRow(row)) return false;
    return true;
  });

  return { headers: parsed.headers, rows: cleaned };
}
