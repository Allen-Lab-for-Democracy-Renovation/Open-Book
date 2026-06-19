"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HelpBox from "@/components/admin/HelpBox";
import StorageIndicator from "@/components/admin/StorageIndicator";

interface Upload {
  id: string;
  fileName: string;
  fileType: string;
  dataCategory: string;
  rowCount: number;
  status: string;
  createdAt: string;
}

interface Town {
  id: string;
  name: string;
  slug: string;
  published: boolean;
}

export default function DataManagementPage() {
  const router = useRouter();
  const [town, setTown] = useState<Town | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      const townsRes = await fetch("/api/towns");
      const towns = await townsRes.json();
      if (towns.length > 0) {
        const t = towns[0];
        setTown(t);

        const uploadsRes = await fetch(`/api/towns/${t.id}/uploads`);
        if (uploadsRes.ok) {
          const data = await uploadsRes.json();
          setUploads(data);
        }
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (uploadId: string) => {
    if (!confirm("Delete this upload and all its budget data?")) return;
    setDeleting(uploadId);
    setError("");

    try {
      const res = await fetch(`/api/uploads/${uploadId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete");
        return;
      }
      await loadData();
    } catch {
      setError("Failed to delete upload");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (upload: Upload) => {
    setDownloading(upload.id);
    try {
      const res = await fetch(`/api/uploads/${upload.id}`);
      if (!res.ok) {
        setError("Failed to download data");
        return;
      }
      const { rows } = await res.json();
      if (!rows || rows.length === 0) {
        setError("No data to download");
        return;
      }
      const fields = [
        "dataCategory", "fiscalYear", "amountType", "amount",
        "functionArea", "department", "lineItem", "objectCode",
        "category1", "category2", "fundCode", "fundName",
      ];
      const csvRows = [
        fields.join(","),
        ...rows.map((r: Record<string, string | number | null>) =>
          fields.map((f) => {
            const val = r[f];
            if (val == null) return "";
            const str = val.toString();
            return str.includes(",") || str.includes('"')
              ? `"${str.replace(/"/g, '""')}"` : str;
          }).join(",")
        ),
      ];
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = upload.fileName.replace(/\.[^.]+$/, "") + "-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download data");
    } finally {
      setDownloading(null);
    }
  };

  const handleDeleteAll = async () => {
    setError("");
    try {
      for (const upload of uploads) {
        await fetch(`/api/uploads/${upload.id}`, { method: "DELETE" });
      }
      setConfirmDeleteAll(false);
      await loadData();
    } catch {
      setError("Failed to delete all data");
    }
  };

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (!town) {
    return (
      <div>
        <p className="text-gray-500">
          No town configured.{" "}
          <Link href="/admin/setup" className="text-blue-600 hover:underline">
            Set up your town
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  const totalRows = uploads.reduce((sum, u) => sum + u.rowCount, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budget Data</h1>
          <p className="text-gray-500 mt-1">
            {uploads.length} upload{uploads.length !== 1 ? "s" : ""} with {totalRows.toLocaleString()} total rows
          </p>
        </div>
        <Link
          href={`/admin/upload?townId=${town.id}`}
          className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Upload New Data
        </Link>
      </div>

      <StorageIndicator />

      <HelpBox variant="info">
        <p>
          This page shows all the budget files you&apos;ve uploaded. Each file
          becomes part of your resident-facing portal. You can upload multiple
          files (e.g., one for expenses, one for revenues) and they&apos;ll all
          appear on your portal. If you upload a corrected version, delete the
          old one first. Use <strong>Download</strong> to export an upload&apos;s
          saved data as a CSV (rebuilt from the stored rows, so column names are
          normalized rather than an exact copy of the original file).
        </p>
      </HelpBox>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      {uploads.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">No data uploaded yet.</p>
          <Link
            href={`/admin/upload?townId=${town.id}`}
            className="text-blue-600 hover:underline text-sm mt-2 inline-block"
          >
            Upload your first file
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm" aria-label="Uploaded budget files">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th scope="col" className="px-4 py-3 text-left font-medium text-gray-600">File</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium text-gray-600">Rows</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload) => (
                  <tr key={upload.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{upload.fileName}</td>
                    <td className="px-4 py-3 capitalize">{upload.dataCategory}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {upload.rowCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          upload.status === "mapped"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {upload.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(upload.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      {upload.rowCount > 0 && (
                        <a
                          href={`/api/uploads/${upload.id}/download`}
                          className="text-gray-600 hover:text-gray-900 text-sm"
                          aria-label={`Download data for ${upload.fileName}`}
                        >
                          Download
                        </a>
                      )}
                      <button
                        onClick={() => handleDownload(upload)}
                        disabled={downloading === upload.id}
                        className="text-gray-600 hover:text-gray-800 text-sm disabled:opacity-50"
                        aria-label={`Download upload ${upload.fileName}`}
                      >
                        {downloading === upload.id ? "Downloading..." : "Download"}
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Replace "${upload.fileName}"? This will delete the current data and open the upload page so you can re-upload with new mappings.`)) return;
                          setDeleting(upload.id);
                          try {
                            const res = await fetch(`/api/uploads/${upload.id}`, { method: "DELETE" });
                            if (res.ok) {
                              router.push(`/admin/upload?townId=${town!.id}`);
                            }
                          } catch {
                            setError("Failed to delete upload");
                          } finally {
                            setDeleting(null);
                          }
                        }}
                        disabled={deleting === upload.id}
                        className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
                        aria-label={`Replace upload ${upload.fileName}`}
                      >
                        Replace
                      </button>
                      <button
                        onClick={() => handleDelete(upload.id)}
                        disabled={deleting === upload.id}
                        className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                        aria-label={`Delete upload ${upload.fileName}`}
                      >
                        {deleting === upload.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <HelpBox variant="warning" title="About deleting data">
              <p>
                Deleting an upload removes it and all its budget rows from
                your portal permanently. If your portal is live, residents
                will no longer see that data. You can always re-upload the
                file later.
              </p>
            </HelpBox>
            <div className="mt-4">
            {!confirmDeleteAll ? (
              <button
                onClick={() => setConfirmDeleteAll(true)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete All Data
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-sm text-red-600">
                  This will delete all uploads and budget data. This cannot be undone.
                </p>
                <button
                  onClick={handleDeleteAll}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                >
                  Confirm Delete All
                </button>
                <button
                  onClick={() => setConfirmDeleteAll(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
