"use client";

import { useState, useEffect } from "react";

interface StorageData {
  database: { sizeBytes: number; uploads: number; budgetRows: number; pdfDocuments: number };
  files: { sizeBytes: number; pdfSizeBytes: number };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

// Pass a refreshKey that changes whenever uploads are added or removed so the
// numbers stay in sync with the table below.
export default function StorageIndicator({ refreshKey }: { refreshKey?: string }) {
  const [data, setData] = useState<StorageData | null>(null);

  useEffect(() => {
    fetch("/api/admin/storage")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [refreshKey]);

  if (!data) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Database Size</h3>
        <span className="text-sm font-medium text-gray-900">
          {formatBytes(data.database.sizeBytes)}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs text-gray-500">
        <div>
          <span className="font-medium text-gray-700">{data.database.budgetRows.toLocaleString()}</span> budget rows
        </div>
        <div>
          <span className="font-medium text-gray-700">{data.database.uploads}</span> uploads
        </div>
        <div>
          <span className="font-medium text-gray-700">{data.database.pdfDocuments}</span> PDF document{data.database.pdfDocuments !== 1 ? "s" : ""}
          {data.files.pdfSizeBytes > 0 && ` (${formatBytes(data.files.pdfSizeBytes)})`}
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500 leading-relaxed">
        This is the total size of the Postgres database your OpenBook site is
        connected to, as reported by the database itself. It includes budget
        rows, uploaded PDFs, and everything else this site stores. How much
        space is available depends on your database provider&apos;s plan
        (for example Neon, Supabase, or Vercel Storage) — check your
        provider&apos;s dashboard for your limit.
      </p>
    </div>
  );
}
