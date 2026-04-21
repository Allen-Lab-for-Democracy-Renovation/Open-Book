"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DevLoginButtons() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (process.env.NODE_ENV === "production") return null;

  const devLogin = async (role: "admin" | "staff") => {
    setLoading(role);
    setError("");
    try {
      const res = await fetch("/api/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Dev login failed");
        return;
      }
      router.push(data.redirect);
    } catch {
      setError("Dev login failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-dashed border-orange-300">
      <p className="text-xs font-medium text-orange-600 text-center mb-3 uppercase tracking-wide">
        Dev Only
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => devLogin("admin")}
          disabled={loading !== null}
          className="flex-1 px-3 py-2 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded-md hover:bg-orange-100 disabled:opacity-50 transition-colors"
        >
          {loading === "admin" ? "..." : "Skip as Admin"}
        </button>
        <button
          onClick={() => devLogin("staff")}
          disabled={loading !== null}
          className="flex-1 px-3 py-2 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded-md hover:bg-orange-100 disabled:opacity-50 transition-colors"
        >
          {loading === "staff" ? "..." : "Skip as Staff"}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-600 text-center mt-2">{error}</p>
      )}
    </div>
  );
}
