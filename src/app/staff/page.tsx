import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/staff-auth";
import { prisma } from "@/lib/db";

export default async function StaffDashboardPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/staff/login");

  const requests = await prisma.capitalRequest.findMany({
    where: { staffUserId: staff.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const allRequests = await prisma.capitalRequest.findMany({
    where: { staffUserId: staff.id },
  });

  const totalRequests = allRequests.length;
  const pendingRequests = allRequests.filter(
    (r) => r.status === "submitted" || r.status === "under_review"
  ).length;
  const approvedRequests = allRequests.filter(
    (r) => r.status === "approved"
  ).length;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      denied: "bg-red-100 text-red-800",
    };
    const labels: Record<string, string> = {
      submitted: "Submitted",
      under_review: "Under Review",
      approved: "Approved",
      denied: "Denied",
    };
    return `inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`;
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: "Submitted",
      under_review: "Under Review",
      approved: "Approved",
      denied: "Denied",
    };
    return labels[status] || status;
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome, {staff.name}
      </h1>
      <p className="text-gray-500 mt-1 mb-6">
        {staff.town?.name} - {staff.department || "Staff"}
      </p>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Requests</p>
          <p className="text-2xl font-semibold">{totalRequests}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-semibold text-yellow-600">{pendingRequests}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-semibold text-green-600">{approvedRequests}</p>
        </div>
      </div>

      {/* Quick Action */}
      <div className="mb-8">
        <Link
          href="/staff/submit"
          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Submit New Capital Request
        </Link>
      </div>

      {/* Recent Requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Recent Requests</h2>
          {totalRequests > 5 && (
            <Link href="/staff/history" className="text-sm text-teal-600 hover:underline">
              View All
            </Link>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-500">No requests yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Submit your first capital expenditure request to get started.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {requests.map((req) => (
              <div key={req.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{req.purpose}</p>
                  <p className="text-xs text-gray-500">
                    {req.department} &middot; {formatDate(req.createdAt)} &middot; {formatCurrency(req.amount)}
                  </p>
                </div>
                <span className={statusBadge(req.status)}>
                  {statusLabel(req.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
