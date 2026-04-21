"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import HelpBox from "@/components/admin/HelpBox";

interface Town {
  id: string;
  name: string;
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

const CATEGORIES = [
  { value: "budget", label: "Budget Document" },
  { value: "meeting", label: "Meeting Minutes" },
  { value: "report", label: "Report" },
  { value: "press", label: "Press Release" },
  { value: "other", label: "Other" },
];

export default function AdminLinksPage() {
  const [town, setTown] = useState<Town | null>(null);
  const [links, setLinks] = useState<SupportingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // New link form
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("other");

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);

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

        const linksRes = await fetch(`/api/links?townId=${t.id}`);
        const linksData = await linksRes.json();
        setLinks(linksData);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add link");
        return;
      }

      const link = await res.json();
      setLinks((prev) => [...prev, link]);
      setNewTitle("");
      setNewUrl("");
      setNewDescription("");
      setNewCategory("other");
    } catch {
      setError("Failed to add link");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm("Delete this link?")) return;

    try {
      const res = await fetch(`/api/links/${linkId}`, { method: "DELETE" });
      if (res.ok) {
        setLinks((prev) => prev.filter((l) => l.id !== linkId));
      }
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

  const cancelEditing = () => {
    setEditingId(null);
  };

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

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update link");
        return;
      }

      const updated = await res.json();
      setLinks((prev) =>
        prev.map((l) => (l.id === linkId ? updated : l))
      );
      setEditingId(null);
    } catch {
      setError("Failed to update link");
    } finally {
      setSaving(false);
    }
  };

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
          Supporting Links
        </h1>
        <p className="text-gray-500 mt-1">
          Add links to external resources that appear on your portal&apos;s
          Documents page.
        </p>
      </div>

      <HelpBox title="What are supporting links?" variant="info">
        <p>
          Supporting links point residents to external resources like your
          town&apos;s official budget documents, meeting minutes on a town
          website, press articles, or reports. These appear on the public
          Documents &amp; Resources page grouped by category.
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

      {/* Add new link form */}
      <section>
        <h2 className="text-lg font-medium mb-4">Add a Link</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="link-title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title
              </label>
              <input
                id="link-title"
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
                htmlFor="link-url"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                URL
              </label>
              <input
                id="link-url"
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/budget.pdf"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="link-description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="link-description"
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="The full adopted budget for fiscal year 2026"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="link-category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="link-category"
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
            disabled={saving || !newTitle.trim() || !newUrl.trim()}
            className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving ? "Adding..." : "Add Link"}
          </button>
        </form>
      </section>

      {/* Existing links */}
      <section>
        <h2 className="text-lg font-medium mb-4">
          Existing Links{" "}
          <span className="text-gray-400 font-normal text-sm">
            ({links.length})
          </span>
        </h2>

        {links.length === 0 ? (
          <p className="text-sm text-gray-400">
            No links added yet. Use the form above to add your first link.
          </p>
        ) : (
          <div className="space-y-3">
            {links.map((link) =>
              editingId === link.id ? (
                <div
                  key={link.id}
                  className="bg-white border border-blue-200 rounded-lg p-4 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        URL
                      </label>
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Category
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
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
                      <label className="block text-xs text-gray-500 mb-1">
                        Sort Order
                      </label>
                      <input
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
                      onClick={() => handleSaveEdit(link.id)}
                      disabled={saving}
                      className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
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
                        <p className="text-sm font-medium">{link.title}</p>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {getCategoryLabel(link.category)}
                        </span>
                        {link.sortOrder > 0 && (
                          <span className="text-xs text-gray-400">
                            #{link.sortOrder}
                          </span>
                        )}
                      </div>
                      {link.description && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {link.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {link.url}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => startEditing(link)}
                        className="text-sm text-gray-500 hover:text-gray-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}
