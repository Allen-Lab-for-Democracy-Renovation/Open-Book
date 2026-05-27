"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HelpBox from "@/components/admin/HelpBox";
import DevLoginButtons from "@/components/dev/DevLoginButtons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        return;
      }

      router.push("/admin/setup");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-center">
          OpenBook Admin
        </h1>
        <p className="text-gray-500 text-center mt-1 mb-6">
          Sign in to manage your portal
        </p>

        <div className="mb-6">
          <HelpBox variant="info">
            <p>
              This is the admin area for managing your town&apos;s budget portal.
              From here you can upload budget data, customize branding, and add
              helpful descriptions for residents.
            </p>
          </HelpBox>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          First time?{" "}
          <Link href="/admin/register" className="text-blue-600 hover:underline">
            Create an account
          </Link>
        </p>

        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>What can you do from here?</strong> Upload and manage
            budget data (CSV or Excel), customize your portal&apos;s name,
            colors, and logo, add tooltips that explain budget items to
            residents, upload supporting documents, and respond to
            resident questions.
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            If this is your first time, you&apos;ll need to{" "}
            <Link href="/admin/register" className="underline">create an account</Link>{" "}
            first.
          </p>
        </div>

        <DevLoginButtons />
      </div>
    </div>
  );
}
