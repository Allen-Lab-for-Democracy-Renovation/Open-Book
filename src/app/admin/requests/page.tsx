"use client";

import { useState, useEffect } from "react";
import HelpBox from "@/components/admin/HelpBox";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  department: string | null;
}

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
  staffUser: StaffUser;
}

interface Town {
  id: string;
  name: string;
  slug: string;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<CapitalRequest[]>([]);
  const [town, setTown] = useState<Town | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // First fetch the town
        const townsRes = await fetch("/api/towns");
        const towns = await townsRes.json();
        if (towns.length === 0) {
          setLoading(false);
          return;
        }
        const t = towns[0] as Town;
        setTown(t);

        // Fetch capital requests for this town
        const res = await fetch(`/api/capital-requests?townId=${t.id}`);
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

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    setUpdating(requestId);
    try {
      const notes = adminNotes[requestId] || "";
      const res = await fetch(`/api/capital-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNotes: notes || undefined }),
      });

      if (res.ok) {
        const updated = await res.json();
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? { ...r, status: updated.status, adminNotes: updated.adminNotes }
              : r
          )
        );
      }
    } catch {
      // Error updating
    } finally {
      setUpdating(null);
    }
  };

  const filteredRequests = filterStatus === "all"
    ? requests
    : requests.filter((r) => r.status === filterStatus);

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (!town) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight mb-4">Capital Requests</h1>
        <p className="text-gray-500">No town configured. Set up a town first.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Capital Requests</h1>
      <p className="text-gray-500 mt-1 mb-4">
        Review and manage staff capital expenditure requests for {town.name}.
      </p>

      <div className="mb-6">
        <HelpBox variant="info">
          <p>
            Capital requests are submitted by staff members for review. You can approve,
            deny, or mark requests as under review. Add notes to communicate decisions
            back to staff.
          </p>
        </HelpBox>
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
            {s === "all" ? `All (${requests.length})` : `${statusLabels[s]} (${requests.filter((r) => r.status === s).length})`}
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-500">
            {filterStatus === "all"
              ? "No capital requests have been submitted yet."
              : `No requests with status "${statusLabels[filterStatus]}".`}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
            <div className="col-span-2">Department</div>
            <div className="col-span-3">Purpose</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Staff</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-2">Status</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-100">
            {filteredRequests.map((req) => (
              <div key={req.id}>
                <button
                  onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                  className="w-full grid grid-cols-12 gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors items-center"
                >
                  <div className="col-span-2 text-sm text-gray-900 truncate">{req.department}</div>
                  <div className="col-span-3 text-sm text-gray-900 truncate">{req.purpose}</div>
                  <div className="col-span-2 text-sm font-medium text-gray-900">{formatCurrency(req.amount)}</div>
                  <div className="col-span-2 text-sm text-gray-600 truncate">{req.staffUser.name}</div>
                  <div className="col-span-1 text-xs text-gray-500">{formatDate(req.createdAt)}</div>
                  <div className="col-span-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        statusStyles[req.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabels[req.status] || req.status}
                    </span>
                  </div>
                </button>

                {expandedId === req.id && (
                  <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500 text-xs">Staff Member</p>
                        <p className="font-medium">{req.staffUser.name}</p>
                        <p className="text-xs text-gray-400">{req.staffUser.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Fiscal Year</p>
                        <p className="font-medium">{req.fiscalYear}</p>
                      </div>
                      {req.fundingSource && (
                        <div>
                          <p className="text-gray-500 text-xs">Funding Source</p>
                          <p className="font-medium">{req.fundingSource}</p>
                        </div>
                      )}
                    </div>

                    {req.description && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Description</p>
                        <p className="text-sm text-gray-700">{req.description}</p>
                      </div>
                    )}

                    {req.justification && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Justification</p>
                        <p className="text-sm text-gray-700">{req.justification}</p>
                      </div>
                    )}

                    {/* Admin Notes Input */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Admin Notes
                      </label>
                      <textarea
                        value={adminNotes[req.id] ?? req.adminNotes ?? ""}
                        onChange={(e) =>
                          setAdminNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        rows={2}
                        placeholder="Add notes about this request..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                      />

                      <div className="flex items-center gap-2">
                        {req.status !== "approved" && (
                          <button
                            onClick={() => handleStatusUpdate(req.id, "approved")}
                            disabled={updating === req.id}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {req.status !== "denied" && (
                          <button
                            onClick={() => handleStatusUpdate(req.id, "denied")}
                            disabled={updating === req.id}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            Deny
                          </button>
                        )}
                        {req.status !== "under_review" && (
                          <button
                            onClick={() => handleStatusUpdate(req.id, "under_review")}
                            disabled={updating === req.id}
                            className="px-3 py-1.5 bg-yellow-500 text-white rounded-md text-xs font-medium hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                          >
                            Under Review
                          </button>
                        )}
                        {updating === req.id && (
                          <span className="text-xs text-gray-400">Updating...</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
