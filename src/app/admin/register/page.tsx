"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HelpBox from "@/components/admin/HelpBox";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationLink, setVerificationLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      if (data.verificationToken) {
        const link = `${window.location.origin}/verify?token=${data.verificationToken}`;
        setVerificationLink(link);
      } else {
        router.push("/admin/setup");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(verificationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text in the input
    }
  };

  if (verificationLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-center">
            Account created
          </h1>
          <p className="text-gray-500 text-center mt-1 mb-6">
            Share the verification link below to verify the email address.
          </p>

          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <label
              htmlFor="admin-verification-link"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Verification link
            </label>
            <div className="flex gap-2">
              <input
                id="admin-verification-link"
                type="text"
                readOnly
                value={verificationLink}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Send this link to the new admin so they can verify their email.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin/setup"
              onClick={(e) => {
                e.preventDefault();
                window.location.assign("/admin/setup");
              }}
              className="flex-1 text-center px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Continue to Setup
            </Link>
            <Link
              href="/admin/register"
              className="flex-1 text-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Register Another
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-center">
          Create Admin Account
        </h1>
        <p className="text-gray-500 text-center mt-1 mb-6">
          Set up your OpenBook administrator account
        </p>

        <div className="mb-6">
          <HelpBox title="What is this?" variant="info">
            <p className="mb-2">
              This is a one-time setup to create the first administrator account
              for your town&apos;s budget portal. After this, you&apos;ll be able to
              upload budget data, customize your portal, and manage everything
              from the admin dashboard.
            </p>
            <p>
              You only need to do this once — after creating your account, you
              can sign in anytime from the{" "}
              <Link href="/admin/login" className="underline font-medium">
                login page
              </Link>.
            </p>
          </HelpBox>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

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
              placeholder="At least 8 characters"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
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
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Already have an account?{" "}
          <Link href="/admin/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
