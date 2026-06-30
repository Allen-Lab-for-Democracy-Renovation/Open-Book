"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import type { DetectedMapping, DataCategory } from "@/types";
import HelpBox from "@/components/admin/HelpBox";

interface CategoryRequirement {
  field: string;
  label: string;
  reason: string;
}

const CATEGORY_REQUIREMENTS: Record<
  DataCategory,
  {
    required: CategoryRequirement[];
    recommended: CategoryRequirement[];
    needsBudgetAmount: boolean;
    note?: string;
  }
> = {
  expenses: {
    required: [
      {
        field: "functionArea",
        label: "Function Area",
        reason: "groups the pie chart and trend chart",
      },
      {
        field: "fyAmount",
        label: "Fiscal Year Amount",
        reason: "the dollar value for each row",
      },
    ],
    recommended: [
      {
        field: "department",
        label: "Department",
        reason: "second-level grouping in the table",
      },
      {
        field: "lineItem",
        label: "Line Item / Description",
        reason: "row label in the table",
      },
      {
        field: "objectCode",
        label: "Account / Object Code",
        reason: "shown alongside line items",
      },
    ],
    needsBudgetAmount: true,
  },
  revenues: {
    required: [
      {
        field: "category1",
        label: "Category",
        reason: "groups the pie chart, trend chart, and table",
      },
      {
        field: "fyAmount",
        label: "Fiscal Year Amount",
        reason: "the dollar value",
      },
    ],
    recommended: [
      {
        field: "category2",
        label: "Subcategory",
        reason: "sub-grouping in the table",
      },
      {
        field: "lineItem",
        label: "Line Item / Description",
        reason: "row label in the table",
      },
    ],
    needsBudgetAmount: true,
  },
  capital: {
    required: [
      {
        field: "department",
        label: "Department",
        reason: "groups the pie chart and 'Top Department' tile",
      },
      {
        field: "purpose",
        label: "Purpose / Project",
        reason: "shown as the project name in the table",
      },
      {
        field: "fundingSource",
        label: "Funding Source",
        reason: "powers the 'Top Funding Source' tile",
      },
      {
        field: "fyAmount",
        label: "Fiscal Year Amount",
        reason: "the dollar value for each project",
      },
    ],
    recommended: [],
    needsBudgetAmount: false,
  },
  reserves: {
    required: [],
    recommended: [],
    needsBudgetAmount: false,
    note: "Reserves data will be saved, but there's no public reserves page yet — nothing will render on the portal.",
  },
};

function getMappingErrors(
  category: DataCategory,
  mappings: DetectedMapping[]
): string[] {
  const errors: string[] = [];
  const req = CATEGORY_REQUIREMENTS[category];
  const mappedFields = new Set(mappings.map((m) => m.targetField));

  for (const r of req.required) {
    if (!mappedFields.has(r.field)) {
      errors.push(`Missing required mapping: ${r.label} (${r.reason}).`);
    }
  }

  const fyAmounts = mappings.filter((m) => m.targetField === "fyAmount");
  if (fyAmounts.length > 0) {
    const missingYear = fyAmounts.filter(
      (m) => !m.fiscalYear || !m.fiscalYear.trim()
    );
    if (missingYear.length > 0) {
      errors.push(
        `Set the fiscal year on ${missingYear.length} amount column${
          missingYear.length === 1 ? "" : "s"
        }.`
      );
    }
    if (
      req.needsBudgetAmount &&
      !fyAmounts.some((m) => m.amountType === "budget")
    ) {
      errors.push(
        `At least one amount column must be set to type "Budget" so the current year shows on the portal.`
      );
    }
  }

  return errors;
}

const CATEGORY_LABELS: Record<DataCategory, string> = {
  expenses: "Expenses",
  revenues: "Revenues",
  capital: "Capital Projects",
  reserves: "Reserves",
};

const SAMPLE_DATA: Record<
  DataCategory,
  { headers: string[]; rows: string[][] }
> = {
  expenses: {
    headers: [
      "Dept",
      "Function",
      "Description",
      "Object Code",
      "FY2024 Actual",
      "FY2025 Budget",
      "FY2026 Budget",
    ],
    rows: [
      [
        "Selectmen",
        "General Government",
        "Town Admin Salary",
        "5110",
        "165000",
        "170000",
        "175000",
      ],
      [
        "Police",
        "Public Safety",
        "Chief Salary",
        "5110",
        "145000",
        "150000",
        "155000",
      ],
      [
        "Police",
        "Public Safety",
        "Patrol Salaries",
        "5110",
        "680000",
        "710000",
        "740000",
      ],
    ],
  },
  revenues: {
    headers: [
      "Category",
      "Source",
      "Description",
      "FY2025 Actual",
      "FY2026 Budget",
    ],
    rows: [
      ["Tax Levy", "Property Tax", "Real Estate Tax", "28500000", "29200000"],
      ["State Aid", "Chapter 70", "School Aid", "5200000", "5350000"],
      ["Local Receipts", "Motor Vehicle", "MV Excise", "1800000", "1850000"],
    ],
  },
  capital: {
    headers: ["Department", "Purpose", "FY2026 Budget", "Funding Source"],
    rows: [
      ["DPW", "Road Resurfacing Program", "500000", "Free Cash"],
      ["Fire", "Engine Replacement", "350000", "Borrowing"],
      ["Schools", "HVAC Replacement", "200000", "Capital Stabilization"],
    ],
  },
  reserves: {
    headers: ["Fund Name", "Category", "FY2025 Balance", "FY2026 Balance"],
    rows: [
      ["Stabilization Fund", "General", "2400000", "2550000"],
      ["Capital Stabilization", "Capital", "1100000", "950000"],
      ["Free Cash", "General", "1800000", "2050000"],
    ],
  },
};

const TARGET_FIELDS = [
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

interface UploadResult {
  uploadId: string;
  headers: string[];
  sampleRows: Record<string, string>[];
  detectedMappings: DetectedMapping[];
  totalRows: number;
}

interface ValidationError {
  field: string;
  message: string;
}

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramTownId = searchParams.get("townId");

  const [townId, setTownId] = useState(paramTownId || "");
  const [category, setCategory] = useState<DataCategory | "">("");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [mappings, setMappings] = useState<DetectedMapping[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [saveResult, setSaveResult] = useState<{
    rowsCreated: number;
    townSlug: string;
  } | null>(null);

  // Auto-detect town if no townId provided
  useEffect(() => {
    if (!paramTownId) {
      fetch("/api/towns")
        .then((res) => res.json())
        .then((towns) => {
          if (towns.length > 0) {
            setTownId(towns[0].id);
          }
        })
        .catch(() => {});
    }
  }, [paramTownId]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file || !townId) return;

      setUploading(true);
      setError("");
      setValidationErrors([]);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("townId", townId);
      formData.append("dataCategory", category);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) {
          if (data.validationErrors) {
            setValidationErrors(data.validationErrors);
          }
          setError(data.error || "Upload failed");
          return;
        }

        const result: UploadResult = data;
        setUploadResult(result);
        setMappings(result.detectedMappings);

        // Re-read file for raw data to send with mapping confirmation
        const text = await file.text();
        const Papa = (await import("papaparse")).default;
        const parsed = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
        });
        setRawData(parsed.data);
      } catch {
        setError("Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [townId, category]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 1,
  });

  const updateMapping = (index: number, field: string, value: string) => {
    setMappings((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        const updated = { ...m, [field]: value };
        if (
          field === "targetField" &&
          value === "fyAmount" &&
          !updated.amountType
        ) {
          updated.amountType = "budget";
        }
        return updated;
      })
    );
  };

  const mappingErrors =
    uploadResult && category ? getMappingErrors(category, mappings) : [];

  const handleConfirmMapping = async () => {
    if (!uploadResult) return;
    if (mappingErrors.length > 0) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId: uploadResult.uploadId,
          mappings: mappings.map((m) => ({
            sourceColumn: m.sourceColumn,
            targetField: m.targetField,
            fiscalYear: m.fiscalYear,
            amountType: m.amountType,
          })),
          rawData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      const result = await res.json();
      if (result.rowsCreated === 0) {
        setSaveResult(result);
        return;
      }

      router.push("/admin/data");
    } catch {
      setError("Failed to save mapping");
    } finally {
      setSaving(false);
    }
  };

  if (!townId) {
    return (
      <div>
        <p className="text-gray-500">
          Please{" "}
          <Link href="/admin/setup" className="text-blue-600 hover:underline">
            set up your town
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Upload Budget Data
        </h1>
        <p className="text-gray-500 mt-1">
          Upload a CSV or Excel file with your budget data.
        </p>
      </div>

      {!uploadResult && (
        <>
          <HelpBox title="How this works" variant="step">
            <p className="mb-1.5">
              <strong>1. Choose a category</strong> — Pick whether you&apos;re
              uploading expenses, revenues, or capital project data.
            </p>
            <p className="mb-1.5">
              <strong>2. Upload your file</strong> — Drag in a CSV or Excel file
              from your accounting system (UMAS exports work great).
            </p>
            <p>
              <strong>3. Map the columns</strong> — We&apos;ll try to match your
              columns automatically. You can correct any that look wrong.
            </p>
          </HelpBox>

          <HelpBox title="What file formats work?" variant="tip">
            <p>
              We accept <strong>.csv</strong> and <strong>.xlsx</strong> (Excel)
              files up to 10 MB. Your file should have a header row with column
              names like &quot;Department&quot;, &quot;Line Item&quot;,
              &quot;FY2026 Budget&quot;, etc. Check the{" "}
              <a href="/docs" className="underline font-medium" target="_blank">
                data format guide
              </a>{" "}
              for details.
            </p>
          </HelpBox>

          <div>
            <label
              htmlFor="dataCategory"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Data Category
            </label>
            <select
              id="dataCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value as DataCategory | "")}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="" disabled>
                Choose a category…
              </option>
              <option value="expenses">Expenses</option>
              <option value="revenues">Revenues</option>
              <option value="capital">Capital Projects</option>
              <option value="reserves">Reserves</option>
            </select>
          </div>

          {category && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Uploads work best when a row represents a different category or
                line amount, rather than a specific year. Additionally, make
                sure that you delete any extraneous cells, like totals, title,
                or header cells. or Your file should look fairly plain,
                something like this:
              </p>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {SAMPLE_DATA[category].headers.map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_DATA[category].rows.map((row, i) => (
                      <tr key={i} className="border-t border-gray-200">
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className="px-3 py-2 text-gray-700 whitespace-nowrap"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Column names don&apos;t need to match the examples exactly —
                we&apos;ll help you map them in the next step.
              </p>
            </div>
          )}

          {category && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              role="button"
              aria-label="Upload file area. Drag and drop or click to browse."
            >
              <input {...getInputProps()} />
              {uploading ? (
                <p className="text-gray-500">Uploading...</p>
              ) : isDragActive ? (
                <p className="text-blue-600">Drop the file here</p>
              ) : (
                <div>
                  <p className="text-gray-600 font-medium">
                    Drag and drop a CSV or Excel file
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or click to browse (max 10MB)
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {error && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-4"
          role="alert"
        >
          <p className="text-sm text-red-600 font-medium">{error}</p>
          {validationErrors.length > 0 && (
            <ul className="mt-2 text-sm text-red-500 list-disc list-inside space-y-1">
              {validationErrors.map((ve, i) => (
                <li key={i}>
                  <span className="font-medium">{ve.field}:</span> {ve.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {uploadResult && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {category && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                  Category
                </p>
                <p className="text-xl font-semibold tracking-tight text-gray-900">
                  {CATEGORY_LABELS[category]}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Rows detected
              </p>
              <p className="text-xl font-semibold tracking-tight text-gray-900">
                {uploadResult.totalRows.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Columns
              </p>
              <p className="text-xl font-semibold tracking-tight text-gray-900">
                {uploadResult.headers.length}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Preview of your file
            </p>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {uploadResult.headers.map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploadResult.sampleRows.slice(0, 2).map((row, i) => (
                    <tr key={i} className="border-t border-gray-200">
                      {uploadResult.headers.map((h) => (
                        <td
                          key={h}
                          className="px-3 py-2 text-gray-700 whitespace-nowrap"
                        >
                          {row[h] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Showing the first 2 rows of{" "}
              {uploadResult.totalRows.toLocaleString()}.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-medium mb-4">Map Your Columns</h2>

            <div className="mb-4">
              <HelpBox title="What does this mean?" variant="info">
                <p>
                  Your spreadsheet has column headers (like &quot;Dept&quot; or
                  &quot;FY26 Adopted&quot;). We need to know what each column
                  represents so we can display the data correctly on your
                  portal. We&apos;ve made our best guess — columns marked
                  &quot;Auto&quot; were matched automatically. Review each one
                  and fix any that look wrong, or choose &quot;Skip this
                  column&quot; for columns you don&apos;t need.
                </p>
              </HelpBox>
            </div>

            {category && CATEGORY_REQUIREMENTS[category].note && (
              <div className="mb-4">
                <HelpBox title="Heads up" variant="warning">
                  <p>{CATEGORY_REQUIREMENTS[category].note}</p>
                </HelpBox>
              </div>
            )}

            {category &&
              CATEGORY_REQUIREMENTS[category].required.length > 0 && (
                <div className="mb-4">
                  <HelpBox
                    title={`What ${CATEGORY_LABELS[category]} charts need`}
                    variant="tip"
                  >
                    <p className="mb-2">
                      Make sure these columns are mapped — the charts and tables
                      won&apos;t render correctly without them:
                    </p>
                    <ul className="list-disc list-inside space-y-1 mb-3">
                      {CATEGORY_REQUIREMENTS[category].required.map((r) => (
                        <li key={r.label}>
                          <strong>{r.label}</strong> — {r.reason}
                        </li>
                      ))}
                    </ul>
                    {CATEGORY_REQUIREMENTS[category].recommended.length > 0 && (
                      <>
                        <p className="mb-2">
                          Recommended for richer detail (optional):
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          {CATEGORY_REQUIREMENTS[category].recommended.map(
                            (r) => (
                              <li key={r.label}>
                                <strong>{r.label}</strong> — {r.reason}
                              </li>
                            )
                          )}
                        </ul>
                      </>
                    )}
                  </HelpBox>
                </div>
              )}

            <div className="space-y-3">
              {mappings.map((m, i) => (
                <div
                  key={m.sourceColumn}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{m.sourceColumn}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {uploadResult.sampleRows
                          .slice(0, 2)
                          .map((r) => r[m.sourceColumn])
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.confidence > 0.8 && (
                        <span className="text-xs text-emerald-600">Auto</span>
                      )}
                      <select
                        value={m.targetField}
                        onChange={(e) =>
                          updateMapping(i, "targetField", e.target.value)
                        }
                        className="px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                        aria-label={`Mapping for ${m.sourceColumn}`}
                      >
                        {TARGET_FIELDS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {m.targetField === "fyAmount" && (
                    <div className="mt-3 flex items-center gap-3 pl-4 border-l-2 border-blue-200">
                      <div>
                        <label
                          htmlFor={`fy-${i}`}
                          className="text-xs text-gray-500"
                        >
                          Fiscal Year
                        </label>
                        <input
                          id={`fy-${i}`}
                          type="text"
                          value={m.fiscalYear || ""}
                          onChange={(e) =>
                            updateMapping(i, "fiscalYear", e.target.value)
                          }
                          placeholder="2026"
                          className="block w-20 px-2 py-1 border border-gray-300 rounded text-sm mt-0.5"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`amt-type-${i}`}
                          className="text-xs text-gray-500"
                        >
                          Type
                        </label>
                        <select
                          id={`amt-type-${i}`}
                          value={m.amountType || "budget"}
                          onChange={(e) =>
                            updateMapping(i, "amountType", e.target.value)
                          }
                          className="block px-2 py-1 border border-gray-300 rounded text-sm mt-0.5"
                        >
                          <option value="actual">Actual</option>
                          <option value="budget">Budget</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {mappingErrors.length > 0 && (
            <HelpBox title="Fix these before saving" variant="warning">
              <ul className="list-disc list-inside space-y-1">
                {mappingErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </HelpBox>
          )}

          {saveResult && saveResult.rowsCreated === 0 && (
            <div
              className="bg-amber-50 border border-amber-200 rounded-lg p-5"
              role="alert"
              aria-live="assertive"
            >
              <h3 className="text-sm font-semibold text-amber-800 mb-2">
                0 rows were saved
              </h3>
              <p className="text-sm text-amber-700 mb-3">
                The file was processed but no usable data rows were produced.
                Common causes:
              </p>
              <ul className="list-disc list-inside text-sm text-amber-700 space-y-1 mb-4">
                <li>
                  Amount columns contain text or symbols that couldn&apos;t be
                  parsed as numbers
                </li>
                <li>
                  The columns mapped as &quot;Fiscal Year Amount&quot; are
                  missing a fiscal year label
                </li>
                <li>All data rows were empty below the header row</li>
                <li>
                  The header row was duplicated or included in the data range
                </li>
              </ul>
              <p className="text-sm text-amber-700 mb-3">
                Check the preview above and verify your column mappings match
                the actual data. You can start over and re-upload.
              </p>
              <button
                onClick={() => {
                  setUploadResult(null);
                  setMappings([]);
                  setRawData([]);
                  setError("");
                  setValidationErrors([]);
                  setSaveResult(null);
                }}
                className="px-4 py-2 bg-amber-700 text-white rounded-md text-sm font-medium hover:bg-amber-800 transition-colors"
              >
                Start Over
              </button>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={handleConfirmMapping}
              disabled={
                saving ||
                mappingErrors.length > 0 ||
                (saveResult !== null && saveResult.rowsCreated === 0)
              }
              title={
                mappingErrors.length > 0
                  ? "Fix the missing required mappings above first"
                  : undefined
              }
              className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Processing..." : "Confirm & Save Data"}
            </button>
            <button
              onClick={() => {
                setUploadResult(null);
                setMappings([]);
                setRawData([]);
                setError("");
                setValidationErrors([]);
                setSaveResult(null);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
