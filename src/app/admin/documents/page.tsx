"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import HelpBox from "@/components/admin/HelpBox";

interface Town {
  id: string;
  name: string;
}

interface PdfDocument {
  id: string;
  townId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  title: string | null;
  category: string;
  createdAt: string;
}

const CATEGORIES = [
  { value: "budget", label: "Budget Document" },
  { value: "meeting", label: "Meeting Minutes" },
  { value: "report", label: "Report" },
  { value: "press", label: "Press Release" },
  { value: "other", label: "Other" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminDocumentsPage() {
  const [town, setTown] = useState<Town | null>(null);
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Upload form
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("other");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const townsRes = await fetch("/api/towns");
        const towns = await townsRes.json();
        if (towns.length === 0) {
          setLoading(false);
          return;
        }
        const t = towns[0];
        setTown(t);

        const pdfsRes = await fetch(`/api/pdf?townId=${t.id}`);
        const pdfsData = await pdfsRes.json();
        setPdfs(pdfsData);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleUpload = async () => {
    if (!town || !selectedFile) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("townId", town.id);
    if (uploadTitle.trim()) formData.append("title", uploadTitle.trim());
    formData.append("category", uploadCategory);

    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Upload failed");
        return;
      }

      const pdf = await res.json();
      setPdfs((prev) => [pdf, ...prev]);
      setSelectedFile(null);
      setUploadTitle("");
      setUploadCategory("other");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (pdfId: string) => {
    if (!confirm("Delete this PDF? The file will be permanently removed."))
      return;

    try {
      const res = await fetch(`/api/pdf/${pdfId}`, { method: "DELETE" });
      if (res.ok) {
        setPdfs((prev) => prev.filter((p) => p.id !== pdfId));
      }
    } catch {
      // ignore
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setError("");
    } else {
      setError("Only PDF files are allowed");
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are allowed");
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  };

  const totalSize = pdfs.reduce((sum, p) => sum + p.fileSize, 0);

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

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

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          PDF Documents
        </h1>
        <p className="text-gray-500 mt-1">
          Upload PDF documents that residents can download from your portal.
        </p>
      </div>

      <HelpBox title="About PDF uploads" variant="info">
        <p>
          Upload budget PDFs, meeting minutes, reports, or other documents you
          want residents to access. Files are stored on the server and appear on
          the public Documents &amp; Resources page. Maximum file size is 50 MB.
        </p>
      </HelpBox>

      {error && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-4"
          role="alert"
        >
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Upload section */}
      <section>
        <h2 className="text-lg font-medium mb-4">Upload a PDF</h2>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          {selectedFile ? (
            <div className="space-y-1">
              <svg
                className="mx-auto h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-700">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-400">
                {formatFileSize(selectedFile.size)}
              </p>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs text-red-500 hover:text-red-700 mt-1"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <svg
                className="mx-auto h-10 w-10 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="text-gray-600 font-medium mt-3">
                Drag and drop a PDF file
              </p>
              <p className="text-sm text-gray-400 mt-1">
                or{" "}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:underline"
                >
                  browse to select
                </button>{" "}
                (max 50 MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Select PDF file"
              />
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="pdf-title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Display Title{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="pdf-title"
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., FY2026 Adopted Budget"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="pdf-category"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Category
                </label>
                <select
                  id="pdf-category"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {uploading ? "Uploading..." : "Upload PDF"}
            </button>
          </div>
        )}
      </section>

      {/* Existing PDFs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">
            Uploaded Documents{" "}
            <span className="text-gray-400 font-normal text-sm">
              ({pdfs.length})
            </span>
          </h2>
          {pdfs.length > 0 && (
            <p className="text-sm text-gray-400">
              Total: {formatFileSize(totalSize)}
            </p>
          )}
        </div>

        {pdfs.length === 0 ? (
          <p className="text-sm text-gray-400">
            No PDFs uploaded yet. Use the form above to upload your first
            document.
          </p>
        ) : (
          <div className="space-y-2">
            {pdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 text-red-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                      <p className="text-sm font-medium truncate">
                        {pdf.title || pdf.fileName}
                      </p>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded shrink-0">
                        {getCategoryLabel(pdf.category)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{pdf.fileName}</span>
                      <span>{formatFileSize(pdf.fileSize)}</span>
                      <span>{formatDate(pdf.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={pdf.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-500 hover:text-gray-900"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDelete(pdf.id)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
