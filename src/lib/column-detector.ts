import type { DetectedMapping } from "@/types";

interface DetectionRule {
  patterns: RegExp[];
  priority: number;
}

const FIELD_RULES: Record<string, DetectionRule> = {
  department: {
    patterns: [/^dept$/i, /department/i, /division/i, /dept\s*code/i, /dept\s*name/i],
    priority: 1,
  },
  lineItem: {
    patterns: [/description/i, /line\s*item/i, /account\s*desc/i, /detail/i, /^name$/i],
    priority: 2,
  },
  objectCode: {
    patterns: [/object\s*code/i, /obj\s*code/i, /account\s*(number|#|no)/i, /^account$/i],
    priority: 3,
  },
  functionArea: {
    patterns: [/function/i, /func/i, /^program$/i],
    priority: 4,
  },
  fundCode: {
    patterns: [/fund\s*(code|#|no)/i, /^fund$/i],
    priority: 5,
  },
  fundName: {
    patterns: [/fund\s*name/i, /fund\s*desc/i],
    priority: 6,
  },
  category1: {
    patterns: [/rev.*cat.*1/i, /^category$/i, /^source$/i, /^type$/i, /revenue\s*type/i],
    priority: 7,
  },
  category2: {
    patterns: [/rev.*cat.*2/i, /sub.*cat/i],
    priority: 8,
  },
  purpose: {
    patterns: [/^purpose$/i, /^project$/i, /project\s*name/i],
    priority: 9,
  },
  fundingSource: {
    patterns: [/funding\s*source/i, /fund.*source/i],
    priority: 10,
  },
  fiscalYear: {
    patterns: [/^fiscal\s*year$/i, /^fy$/i, /^year$/i],
    priority: 11,
  },
};

const FY_AMOUNT_PATTERN =
  /(?:fy\s*)?(\d{2,4})\s*(actual|budget|approp|request|recommended|adopted|estimate)/i;

const FY_ONLY_PATTERN = /^(?:fy\s*)?(\d{4})$/i;

function matchField(header: string): { field: string; confidence: number } | null {
  for (const [field, rule] of Object.entries(FIELD_RULES)) {
    for (const pattern of rule.patterns) {
      if (pattern.test(header)) {
        return { field, confidence: 0.9 };
      }
    }
  }
  return null;
}

function matchFYAmount(
  header: string
): { fiscalYear: string; amountType: string; confidence: number } | null {
  const match = header.match(FY_AMOUNT_PATTERN);
  if (match) {
    let year = match[1];
    if (year.length === 2) year = `20${year}`;
    const type = match[2].toLowerCase();
    const amountType =
      type === "actual" ? "actual" : type === "budget" || type === "approp" || type === "adopted" ? "budget" : type;
    return { fiscalYear: year, amountType, confidence: 0.95 };
  }

  const fyOnly = header.match(FY_ONLY_PATTERN);
  if (fyOnly) {
    return { fiscalYear: fyOnly[1], amountType: "budget", confidence: 0.5 };
  }

  return null;
}

export function detectColumns(headers: string[]): DetectedMapping[] {
  const mappings: DetectedMapping[] = [];
  const usedFields = new Set<string>();

  for (const header of headers) {
    // First check if it's a FY amount column
    const fyMatch = matchFYAmount(header);
    if (fyMatch) {
      mappings.push({
        sourceColumn: header,
        targetField: "fyAmount",
        confidence: fyMatch.confidence,
        fiscalYear: fyMatch.fiscalYear,
        amountType: fyMatch.amountType,
      });
      continue;
    }

    // Then check field patterns
    const fieldMatch = matchField(header);
    if (fieldMatch && !usedFields.has(fieldMatch.field)) {
      usedFields.add(fieldMatch.field);
      mappings.push({
        sourceColumn: header,
        targetField: fieldMatch.field,
        confidence: fieldMatch.confidence,
      });
      continue;
    }

    // Unmatched
    mappings.push({
      sourceColumn: header,
      targetField: "skip",
      confidence: 0,
    });
  }

  return mappings;
}

export const TARGET_FIELDS = [
  { value: "department", label: "Department" },
  { value: "lineItem", label: "Line Item / Description" },
  { value: "objectCode", label: "Account / Object Code" },
  { value: "functionArea", label: "Function Area" },
  { value: "fundCode", label: "Fund Code" },
  { value: "fundName", label: "Fund Name" },
  { value: "category1", label: "Category" },
  { value: "category2", label: "Subcategory" },
  { value: "purpose", label: "Purpose / Project" },
  { value: "fundingSource", label: "Funding Source" },
  { value: "fiscalYear", label: "Fiscal Year" },
  { value: "fyAmount", label: "Fiscal Year Amount" },
  { value: "skip", label: "Skip this column" },
];
