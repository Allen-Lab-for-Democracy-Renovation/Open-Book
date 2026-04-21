"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CapitalRequest {
  id: string;
  department: string;
  purpose: string;
  description: string | null;
  amount: number;
  fundingSource: string | null;
  justification: string | null;
  fiscalYear: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function StaffHistoryPage() {
  const [requests, setRequests] = useState<CapitalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    async function load() {
      try {
        // Fetch current user info first to get staffUserId
        const meRes = await fetch("/api/staff/auth/me");
        if (!meRes.ok) {
          window.location.href = "/staff/login";
          return;
        }
        const me = await meRes.json();

        const res = await fetch(`/api/capital-requests?staffUserId=${me.id}`);
        const data = await res.json();
        setRequests(data);
      } catch {
        // Error loading
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));

  const statusStyles: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-800",
    under_review: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    denied: "bg-red-100 text-red-800",
  };

  const statusLabels: Record<string, string> = {
    submitted: "Submitted",
    under_review: "Under Review",
    approved: "Approved",
    denied: "Denied",
  };

  const filteredRequests = filterStatus === "all"
    ? requests
    : requests.filter((r) => r.status === filterStatus);

  if (loading) {
    return <p className="text-gray-500">Loading requests...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Request History</h1>
          <p className="text-gray-500 mt-1">
            View and track all your capital expenditure requests.
          </p>
        </div>
        <Link
          href="/staff/submit"
          className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          New Request
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-500">Filter:</span>
        {["all", "submitted", "under_review", "approved", "denied"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterStatus === s
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "all" ? "All" : statusLabels[s] || s}
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-500">
            {filterStatus === "all"
              ? "No requests yet."
              : `No requests with status "${statusLabels[filterStatus]}".`}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {filteredRequests.map((req) => (
            <div key={req.id}>
              <button
                onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {req.purpose}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        statusStyles[req.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabels[req.status] || req.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {req.department} &middot; {formatDate(req.createdAt)} &middot; {formatCurrency(req.amount)}
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    expandedId === req.id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedId === req.id && (
                <div className="px-4 pb-4 pt-1 bg-gray-50 border-t border-gray-100">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Fiscal Year</dt>
                      <dd className="font-medium">{req.fiscalYear}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Amount</dt>
                      <dd className="font-medium">{formatCurrency(req.amount)}</dd>
                    </div>
                    {req.fundingSource && (
                      <div>
                        <dt className="text-gray-500">Funding Source</dt>
                        <dd className="font-medium">{req.fundingSource}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-gray-500">Last Updated</dt>
                      <dd className="font-medium">{formatDate(req.updatedAt)}</dd>
                    </div>
                  </dl>

                  {req.description && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Description</p>
                      <p className="text-sm text-gray-700">{req.description}</p>
                    </div>
                  )}

                  {req.justification && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Justification</p>
                      <p className="text-sm text-gray-700">{req.justification}</p>
                    </div>
                  )}

                  {req.adminNotes && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded p-3">
                      <p className="text-xs font-medium text-amber-800 mb-1">Admin Notes</p>
                      <p className="text-sm text-amber-700">{req.adminNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
