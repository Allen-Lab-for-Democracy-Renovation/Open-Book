"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import HelpBox from "@/components/admin/HelpBox";
import { MAX_PDF_SIZE, MAX_PDF_SIZE_LABEL } from "@/lib/upload-limits";

interface Town {
  id: string;
  name: string;
  slug: string;
}

interface SupportingLink {
  id: string;
  townId: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  sortOrder: number;
  createdAt: string;
}

interface PdfDocument {
  id: string;
  townId: string;
  fileName: string;
  filePath: string | null;
  fileSize: number;
  title: string | null;
  description: string | null;
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

// Grouping and order mirror the public Documents & Resources page, so what an
// admin sees here is arranged the way residents will see it.
const CATEGORY_ORDER = ["budget", "meeting", "report", "press", "other"];

const CATEGORY_HEADINGS: Record<string, string> = {
  budget: "Budget Documents",
  meeting: "Meeting Minutes",
  report: "Reports",
  press: "Press Releases",
  other: "Other Documents",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminDocumentsPage() {
  const [town, setTown] = useState<Town | null>(null);
  const [links, setLinks] = useState<SupportingLink[]>([]);
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Add form. Title, description, and category are shared by both kinds of
  // resource, so switching tabs keeps whatever has already been typed.
  const [addMode, setAddMode] = useState<"link" | "pdf">("link");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("other");
  const [newUrl, setNewUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Editing applies to links only — a PDF's file cannot be changed in place.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);

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

        const [linksRes, pdfsRes] = await Promise.all([
          fetch(`/api/links?townId=${t.id}`),
          fetch(`/api/pdf?townId=${t.id}`),
        ]);
        setLinks(await linksRes.json());
        setPdfs(await pdfsRes.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const resetAddForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewCategory("other");
    setNewUrl("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddLink = async () => {
    if (!town || !newTitle.trim() || !newUrl.trim()) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          townId: town.id,
          title: newTitle.trim(),
          url: newUrl.trim(),
          description: newDescription.trim() || null,
          category: newCategory,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          data?.error || `Could not add that link (server error ${res.status})`
        );
        return;
      }

      setLinks((prev) => [...prev, data]);
      resetAddForm();
    } catch {
      setError(
        "Could not add that link. Please check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPdf = async () => {
    if (!town || !selectedFile) return;

    setSaving(true);
    setError("");

    if (selectedFile.size > MAX_PDF_SIZE) {
      setError(
        `This file is ${formatFileSize(selectedFile.size)}. The maximum is ${MAX_PDF_SIZE_LABEL}. For larger documents, host the file on your municipality's website and add it as a link instead.`
      );
      setSaving(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("townId", town.id);
    if (newTitle.trim()) formData.append("title", newTitle.trim());
    if (newDescription.trim())
      formData.append("description", newDescription.trim());
    formData.append("category", newCategory);

    try {
      const res = await fetch("/api/pdf", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || `Upload failed (server error ${res.status})`);
        return;
      }

      setPdfs((prev) => [data, ...prev]);
      resetAddForm();
    } catch {
      setError("Upload failed. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm("Delete this link?")) return;

    try {
      const res = await fetch(`/api/links/${linkId}`, { method: "DELETE" });
      if (res.ok) setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch {
      // ignore
    }
  };

  const handleDeletePdf = async (pdfId: string) => {
    if (!confirm("Delete this PDF? The file will be permanently removed."))
      return;

    try {
      const res = await fetch(`/api/pdf/${pdfId}`, { method: "DELETE" });
      if (res.ok) setPdfs((prev) => prev.filter((p) => p.id !== pdfId));
    } catch {
      // ignore
    }
  };

  const startEditing = (link: SupportingLink) => {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
    setEditDescription(link.description || "");
    setEditCategory(link.category);
    setEditSortOrder(link.sortOrder);
  };

  const cancelEditing = () => setEditingId(null);

  const handleSaveEdit = async (linkId: string) => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          url: editUrl.trim(),
          description: editDescription.trim() || null,
          category: editCategory,
          sortOrder: editSortOrder,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to update link");
        return;
      }

      setLinks((prev) => prev.map((l) => (l.id === linkId ? data : l)));
      setEditingId(null);
    } catch {
      setError("Failed to update link");
    } finally {
      setSaving(false);
    }
  };

  // Catch the two things the server also rejects, before spending an upload
  // on them.
  const acceptFile = useCallback((file: File) => {
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      return;
    }
    if (file.size > MAX_PDF_SIZE) {
      setError(
        `This file is ${formatFileSize(file.size)}. The maximum is ${MAX_PDF_SIZE_LABEL}. For larger documents, host the file on your municipality's website and add it as a link instead.`
      );
      return;
    }
    setSelectedFile(file);
    setError("");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) acceptFile(file);
    },
    [acceptFile]
  );

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
    if (file) acceptFile(file);
  };

  const totalPdfSize = pdfs.reduce((sum, p) => sum + p.fileSize, 0);
  const totalResources = links.length + pdfs.length;

  const activeCategories = CATEGORY_ORDER.filter(
    (cat) =>
      links.some((l) => (l.category || "other") === cat) ||
      pdfs.some((p) => (p.category || "other") === cat)
  );

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

  const canSubmit =
    addMode === "link"
      ? Boolean(newTitle.trim() && newUrl.trim())
      : Boolean(selectedFile);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Documents &amp; Resources
        </h1>
        <p className="text-gray-500 mt-1">
          Everything on your portal&apos;s Documents &amp; Resources page — both
          links to documents hosted elsewhere and PDFs uploaded here.
        </p>
      </div>

      <HelpBox title="Link or upload?" variant="info">
        <p className="mb-2">
          <strong>Add a link</strong> when the document already lives on your
          municipality&apos;s website. There is no size limit, and residents
          always get the current version of the file rather than a copy that
          goes stale. This is the better option for most documents.
        </p>
        <p>
          <strong>Upload a PDF</strong> when a document is not published
          anywhere online yet. Maximum file size is {MAX_PDF_SIZE_LABEL}.
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

      {/* Add a resource */}
      <section>
        <h2 className="text-lg font-medium mb-4">Add a Resource</h2>

        <div className="inline-flex rounded-md border border-gray-300 p-0.5 mb-5">
          <button
            type="button"
            aria-pressed={addMode === "link"}
            onClick={() => {
              setAddMode("link");
              setError("");
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              addMode === "link"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Add a link
          </button>
          <button
            type="button"
            aria-pressed={addMode === "pdf"}
            onClick={() => {
              setAddMode("pdf");
              setError("");
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              addMode === "pdf"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Upload a PDF
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (addMode === "link") handleAddLink();
            else handleUploadPdf();
          }}
          className="space-y-4"
        >
          {addMode === "link" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="resource-title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Title
                </label>
                <input
                  id="resource-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="FY2026 Adopted Budget"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="resource-url"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  URL
                </label>
                <input
                  id="resource-url"
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com/budget.pdf"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          ) : (
            <>
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
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
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
                    <p className="text-sm text-gray-500 mt-1">
                      or{" "}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:underline"
                      >
                        browse to select
                      </button>{" "}
                      (PDF, max {MAX_PDF_SIZE_LABEL})
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

              <div>
                <label
                  htmlFor="resource-title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Display Title{" "}
                  <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  id="resource-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., FY2026 Adopted Budget — defaults to the file name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="resource-description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description{" "}
                <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                id="resource-description"
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="A short summary residents will see under the title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="resource-category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="resource-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
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
            type="submit"
            disabled={saving || !canSubmit}
            className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving
              ? addMode === "link"
                ? "Adding..."
                : "Uploading..."
              : addMode === "link"
                ? "Add Link"
                : "Upload PDF"}
          </button>
        </form>
      </section>

      {/* Everything residents can see, grouped the way they see it */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">
            On Your Portal{" "}
            <span className="text-gray-400 font-normal text-sm">
              ({totalResources})
            </span>
          </h2>
          {totalResources > 0 && (
            <p className="text-sm text-gray-500">
              {links.length} link{links.length === 1 ? "" : "s"} &middot;{" "}
              {pdfs.length} PDF{pdfs.length === 1 ? "" : "s"}
              {pdfs.length > 0 && ` (${formatFileSize(totalPdfSize)})`}
            </p>
          )}
        </div>

        {totalResources === 0 ? (
          <p className="text-sm text-gray-500">
            Nothing added yet. Use the form above to add your first link or
            upload a PDF.
          </p>
        ) : (
          <div className="space-y-8">
            {activeCategories.map((cat) => {
              const catLinks = links.filter(
                (l) => (l.category || "other") === cat
              );
              const catPdfs = pdfs.filter(
                (p) => (p.category || "other") === cat
              );

              return (
                <div key={cat}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {CATEGORY_HEADINGS[cat] || cat}
                  </h3>
                  <div className="space-y-3">
                    {catLinks.map((link) =>
                      editingId === link.id ? (
                        <div
                          key={link.id}
                          className="bg-white border border-blue-200 rounded-lg p-4 space-y-3"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label
                                htmlFor={`edit-title-${link.id}`}
                                className="block text-xs text-gray-500 mb-1"
                              >
                                Title
                              </label>
                              <input
                                id={`edit-title-${link.id}`}
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`edit-url-${link.id}`}
                                className="block text-xs text-gray-500 mb-1"
                              >
                                URL
                              </label>
                              <input
                                id={`edit-url-${link.id}`}
                                type="url"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label
                                htmlFor={`edit-desc-${link.id}`}
                                className="block text-xs text-gray-500 mb-1"
                              >
                                Description
                              </label>
                              <input
                                id={`edit-desc-${link.id}`}
                                type="text"
                                value={editDescription}
                                onChange={(e) =>
                                  setEditDescription(e.target.value)
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`edit-cat-${link.id}`}
                                className="block text-xs text-gray-500 mb-1"
                              >
                                Category
                              </label>
                              <select
                                id={`edit-cat-${link.id}`}
                                value={editCategory}
                                onChange={(e) =>
                                  setEditCategory(e.target.value)
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {CATEGORIES.map((c) => (
                                  <option key={c.value} value={c.value}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label
                                htmlFor={`edit-sort-${link.id}`}
                                className="block text-xs text-gray-500 mb-1"
                              >
                                Sort Order
                              </label>
                              <input
                                id={`edit-sort-${link.id}`}
                                type="number"
                                value={editSortOrder}
                                onChange={(e) =>
                                  setEditSortOrder(Number(e.target.value))
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(link.id)}
                              disabled={saving}
                              className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={link.id}
                          className="bg-white border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                                  Link
                                </span>
                                <p className="text-sm font-medium truncate">
                                  {link.title}
                                </p>
                                {link.sortOrder > 0 && (
                                  <span className="text-xs text-gray-500 shrink-0">
                                    #{link.sortOrder}
                                  </span>
                                )}
                              </div>
                              {link.description && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {link.description}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {link.url}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-500 hover:text-gray-900"
                              >
                                Open
                              </a>
                              <button
                                type="button"
                                onClick={() => startEditing(link)}
                                className="text-sm text-gray-500 hover:text-gray-900"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLink(link.id)}
                                className="text-sm text-red-500 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    )}

                    {catPdfs.map((pdf) => (
                      <div
                        key={pdf.id}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="shrink-0 rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">
                                PDF
                              </span>
                              <p className="text-sm font-medium truncate">
                                {pdf.title || pdf.fileName}
                              </p>
                            </div>
                            {pdf.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {pdf.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {pdf.fileName} &middot;{" "}
                              {formatFileSize(pdf.fileSize)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              // Legacy documents still point at their file on
                              // disk; newer ones come from the database.
                              href={pdf.filePath || `/api/pdf/${pdf.id}/file`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-gray-500 hover:text-gray-900"
                            >
                              View
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeletePdf(pdf.id)}
                              className="text-sm text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-sm text-gray-500 mt-6">
          See how this looks to residents on your{" "}
          <a
            href={`/${town.slug}/documents`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            public Documents &amp; Resources page
          </a>
          .
        </p>
      </section>
    </div>
  );
}
