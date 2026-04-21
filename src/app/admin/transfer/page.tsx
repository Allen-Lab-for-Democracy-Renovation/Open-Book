"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HelpBox from "@/components/admin/HelpBox";

export default function TransferPage() {
  const router = useRouter();
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm) {
      setConfirm(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, newName, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Transfer failed");
        return;
      }

      router.push("/admin/login");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">
        Transfer Account
      </h1>
      <p className="text-gray-500 mt-1 mb-6">
        Transfer admin access to a new person.
      </p>

      <HelpBox variant="warning" title="Important">
        <p>
          This will create a new admin account and permanently delete your
          current account. You will be logged out immediately. The new admin
          will need to log in with their new credentials. All portal data
          (budget uploads, tooltips, settings) will be preserved.
        </p>
      </HelpBox>

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        <div>
          <label htmlFor="newName" className="block text-sm font-medium text-gray-700 mb-1">
            New Admin Name
          </label>
          <input
            id="newName"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-1">
            New Admin Email
          </label>
          <input
            id="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            New Admin Password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={8}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={8}
          />
        </div>

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        {confirm && (
          <HelpBox variant="warning">
            <p className="font-medium">
              Are you sure? This action cannot be undone. Your account will be
              deleted and replaced with the new admin account.
            </p>
          </HelpBox>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
            confirm
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          {loading
            ? "Transferring..."
            : confirm
            ? "Confirm Transfer"
            : "Transfer Account"}
        </button>

        {confirm && (
          <button
            type="button"
            onClick={() => setConfirm(false)}
            className="ml-3 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}
