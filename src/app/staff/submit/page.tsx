"use client";

import { useState } from "react";
import Link from "next/link";

export default function StaffSubmitPage() {
  const [department, setDepartment] = useState("");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [fundingSource, setFundingSource] = useState("");
  const [justification, setJustification] = useState("");
  const [fiscalYear, setFiscalYear] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid positive amount");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/capital-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department,
          purpose,
          description: description || undefined,
          amount: numericAmount,
          fundingSource: fundingSource || undefined,
          justification: justification || undefined,
          fiscalYear,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit request");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-green-800 mb-2">
            Request Submitted
          </h2>
          <p className="text-sm text-green-700 mb-4">
            Your capital expenditure request has been submitted successfully and is pending review.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/staff/history"
              className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              View History
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setDepartment("");
                setPurpose("");
                setDescription("");
                setAmount("");
                setFundingSource("");
                setJustification("");
                setFiscalYear("");
              }}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">
        Submit Capital Request
      </h1>
      <p className="text-gray-500 mt-1 mb-6">
        Submit a capital expenditure request for review and approval.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <input
            id="department"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g., Public Works"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>

        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
            Purpose
          </label>
          <input
            id="purpose"
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g., Road resurfacing on Main St"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Provide additional details about the expenditure..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount ($)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 50000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>

        <div>
          <label htmlFor="fundingSource" className="block text-sm font-medium text-gray-700 mb-1">
            Funding Source <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="fundingSource"
            type="text"
            value={fundingSource}
            onChange={(e) => setFundingSource(e.target.value)}
            placeholder="e.g., General Fund, Chapter 90, Free Cash"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-1">
            Justification <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="justification"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
            placeholder="Why is this expenditure necessary? What problem does it solve?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label htmlFor="fiscalYear" className="block text-sm font-medium text-gray-700 mb-1">
            Fiscal Year
          </label>
          <input
            id="fiscalYear"
            type="text"
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            placeholder="e.g., FY2026"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
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
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
