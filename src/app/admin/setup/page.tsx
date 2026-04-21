"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HelpBox from "@/components/admin/HelpBox";

interface Town {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  logoUrl: string | null;
  contactEmail: string | null;
  aboutText: string | null;
  published: boolean;
}

export default function SetupPage() {
  const router = useRouter();
  const [town, setTown] = useState<Town | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("#1e40af");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadTown() {
      try {
        const res = await fetch("/api/towns");
        const towns = await res.json();
        if (towns.length > 0) {
          // Load full town data
          const t = towns[0] as Town;
          setTown(t);
          setName(t.name);
          setSlug(t.slug);
          setColor(t.primaryColor);
          setLogoUrl(t.logoUrl || "");
          setContactEmail(t.contactEmail || "");
          setAboutText(t.aboutText || "");
        } else {
          setIsNew(true);
        }
      } catch {
        setError("Failed to load town data");
      } finally {
        setLoading(false);
      }
    }
    loadTown();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/logo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Logo upload failed");
        return;
      }
      setLogoUrl(data.url);
    } catch {
      setError("Logo upload failed");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (isNew) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (isNew) {
        const res = await fetch("/api/towns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            slug,
            primaryColor: color,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to create town");
          return;
        }

        const newTown = await res.json();
        // Now update with additional fields
        await fetch(`/api/towns/${newTown.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logoUrl, contactEmail, aboutText }),
        });

        setTown(newTown);
        setIsNew(false);
        router.push(`/admin/upload?townId=${newTown.id}`);
      } else {
        const res = await fetch(`/api/towns/${town!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            slug,
            primaryColor: color,
            logoUrl,
            contactEmail,
            aboutText,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to save settings");
          return;
        }

        const updated = await res.json();
        setTown(updated);
        setSuccess("Settings saved successfully");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">
        {isNew ? "Set Up Your Town" : "Town Settings"}
      </h1>
      <p className="text-gray-500 mt-1 mb-6">
        {isNew
          ? "Create a budget transparency portal for your municipality."
          : "Manage your portal's branding and information."}
      </p>

      {isNew ? (
        <div className="mb-6">
          <HelpBox title="Getting started" variant="step">
            <p className="mb-1"><strong>Step 1 (you are here):</strong> Enter your town&apos;s basic information below.</p>
            <p className="mb-1"><strong>Step 2:</strong> Upload your budget data (CSV or Excel).</p>
            <p className="mb-1"><strong>Step 3:</strong> Map the columns in your file to budget fields.</p>
            <p><strong>Step 4:</strong> Your portal is live for residents!</p>
          </HelpBox>
        </div>
      ) : (
        <div className="mb-6">
          <HelpBox variant="info">
            <p>
              Changes you make here will update your resident-facing portal
              immediately. The town name, color, and logo appear on every
              page of your portal.
            </p>
          </HelpBox>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="townName" className="block text-sm font-medium text-gray-700 mb-1">
            Town Name
          </label>
          <input
            id="townName"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Sutton"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="townSlug" className="block text-sm font-medium text-gray-700 mb-1">
            URL Slug
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">openbook.gov/</span>
            <input
              id="townSlug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            This is the web address for your portal. It&apos;s auto-generated from
            your town name. Use lowercase letters and dashes only.
          </p>
        </div>

        <div>
          <label htmlFor="brandColor" className="block text-sm font-medium text-gray-700 mb-1">
            Brand Color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="brandColor"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
            />
            <span className="text-sm text-gray-500">{color}</span>
          </div>
        </div>

        <div>
          <label htmlFor="logoFile" className="block text-sm font-medium text-gray-700 mb-1">
            Town Logo
          </label>
          {logoUrl && (
            <div className="mb-3 flex items-center gap-3">
              <img
                src={logoUrl}
                alt="Current logo"
                className="h-12 w-12 object-contain rounded border border-gray-200"
              />
              <button
                type="button"
                onClick={() => setLogoUrl("")}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          )}
          <input
            id="logoFile"
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleLogoUpload}
            disabled={logoUploading}
            className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50"
          />
          <p className="text-xs text-gray-400 mt-1">
            {logoUploading
              ? "Uploading..."
              : "Upload your town seal or logo. PNG, JPEG, SVG, or WebP (max 5 MB)."}
          </p>
        </div>

        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Email
          </label>
          <input
            id="contactEmail"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="finance@townname.gov"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            This email will be shown on your portal so residents can reach out
            with questions about the budget.
          </p>
        </div>

        <div>
          <label htmlFor="aboutText" className="block text-sm font-medium text-gray-700 mb-1">
            About This Portal
          </label>
          <textarea
            id="aboutText"
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            rows={4}
            placeholder="Tell residents about this budget transparency portal..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        {success && <p className="text-sm text-emerald-600" role="status">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {saving
            ? "Saving..."
            : isNew
            ? "Create Town & Upload Data"
            : "Save Settings"}
        </button>

        {town?.published && town?.slug && (
          <a
            href={`/${town.slug}`}
            className="ml-4 text-sm text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Portal
          </a>
        )}
      </form>
    </div>
  );
}
