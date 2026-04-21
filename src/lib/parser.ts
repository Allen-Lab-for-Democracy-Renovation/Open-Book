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
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    throw new Error("Could not read Excel file. It may be corrupted or in an unsupported format.");
  }

  if (workbook.SheetNames.length === 0) {
    throw new Error("Excel file has no sheets.");
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
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
