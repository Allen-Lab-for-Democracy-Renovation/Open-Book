"use client";

import { useState, useEffect } from "react";

interface StorageData {
  database: { sizeBytes: number; uploads: number; budgetRows: number; pdfDocuments: number };
  files: { sizeBytes: number; pdfSizeBytes: number };
  total: { sizeBytes: number; limitBytes: number; percentUsed: number };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function StorageIndicator() {
  const [data, setData] = useState<StorageData | null>(null);

  useEffect(() => {
    fetch("/api/admin/storage")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  const pct = Math.min(data.total.percentUsed, 100);
  const barColor =
    pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Storage Usage</h3>
        <span className="text-xs text-gray-500">
          {formatBytes(data.total.sizeBytes)} / {formatBytes(data.total.limitBytes)}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pct}% storage used`}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
        <div>
          <span className="font-medium text-gray-700">{data.database.budgetRows.toLocaleString()}</span> budget rows
        </div>
        <div>
          <span className="font-medium text-gray-700">{data.database.uploads}</span> uploads
        </div>
        <div>
          <span className="font-medium text-gray-700">{data.database.pdfDocuments}</span> PDF documents
        </div>
        <div>
          Database: <span className="font-medium text-gray-700">{formatBytes(data.database.sizeBytes)}</span>
        </div>
      </div>
    </div>
  );
}
