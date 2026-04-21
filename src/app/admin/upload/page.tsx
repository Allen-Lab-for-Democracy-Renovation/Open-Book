"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import type { DetectedMapping, DataCategory } from "@/types";
import HelpBox from "@/components/admin/HelpBox";

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
  const [category, setCategory] = useState<DataCategory>("expenses");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [mappings, setMappings] = useState<DetectedMapping[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);

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
        const res = await fetch("/api/upload", { method: "POST", body: formData });
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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
  });

  const updateMapping = (index: number, field: string, value: string) => {
    setMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const handleConfirmMapping = async () => {
    if (!uploadResult) return;
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
          <a href="/admin/setup" className="text-blue-600 hover:underline">
            set up your town
          </a>{" "}
          first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Upload Budget Data</h1>
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
              <strong>2. Upload your file</strong> — Drag in a CSV or Excel
              file from your accounting system (UMAS exports work great).
            </p>
            <p>
              <strong>3. Map the columns</strong> — We&apos;ll try to match
              your columns automatically. You can correct any that look wrong.
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
            <label htmlFor="dataCategory" className="block text-sm font-medium text-gray-700 mb-2">
              Data Category
            </label>
            <select
              id="dataCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value as DataCategory)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="expenses">Expenses</option>
              <option value="revenues">Revenues</option>
              <option value="capital">Capital Projects</option>
              <option value="reserves">Reserves</option>
            </select>
          </div>

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
                <p className="text-sm text-gray-400 mt-1">
                  or click to browse (max 10MB)
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
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
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{uploadResult.totalRows}</span> rows detected with{" "}
              <span className="font-medium">{uploadResult.headers.length}</span> columns
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

            <div className="space-y-3">
              {mappings.map((m, i) => (
                <div
                  key={m.sourceColumn}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{m.sourceColumn}</p>
                      <p className="text-xs text-gray-400 mt-1 truncate">
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
                        <label className="text-xs text-gray-500">Fiscal Year</label>
                        <input
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
                        <label className="text-xs text-gray-500">Type</label>
                        <select
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

          <div className="flex items-center gap-4">
            <button
              onClick={handleConfirmMapping}
              disabled={saving}
              className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
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
