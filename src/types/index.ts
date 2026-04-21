export interface ParsedFile {
  headers: string[];
  rows: Record<string, string>[];
}

export interface DetectedMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  fiscalYear?: string;
  amountType?: string;
}

export interface ColumnMappingInput {
  sourceColumn: string;
  targetField: string;
  fiscalYear?: string;
  amountType?: string;
}

export interface NormalizedRow {
  fundCode: string | null;
  fundName: string | null;
  department: string | null;
  departmentCode: string | null;
  functionArea: string | null;
  lineItem: string | null;
  objectCode: string | null;
  category1: string | null;
  category2: string | null;
  fiscalYear: string;
  amount: number;
  amountType: string;
  purpose: string | null;
  fundingSource: string | null;
}

export interface SummaryTile {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export interface ChartData {
  labels: string[];
  values: number[];
}

export type DataCategory = "expenses" | "revenues" | "capital" | "reserves";
