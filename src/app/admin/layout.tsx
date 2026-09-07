import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminLogoutButton from "@/components/admin/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // If not authenticated, render children without admin chrome (login/register pages)
  if (!user) {
    return <>{children}</>;
  }

  const town = await prisma.town.findFirst({ select: { slug: true } });

  const navItems = [
    { href: "/admin/setup", label: "Settings" },
    { href: "/admin/upload", label: "Upload" },
    { href: "/admin/data", label: "Data" },
    { href: "/admin/tooltips", label: "Tooltips" },
    { href: "/admin/documents", label: "Documents" },
    { href: "/admin/faqs", label: "FAQs" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/requests", label: "Requests" },
    { href: "/admin/transfer", label: "Transfer" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin/setup" className="text-lg font-semibold tracking-tight shrink-0">
            OpenBook <span className="text-gray-500 font-normal">Admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <nav
              className="hidden lg:flex items-center gap-3 text-sm"
              aria-label="Admin navigation"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-600 hover:text-gray-900 whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ))}
              {town && (
                <a
                  href={`/${town.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                >
                  Preview
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                    aria-hidden="true"
                  >
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                </a>
              )}
            </nav>
            <AdminLogoutButton />
          </div>
        </div>
        <nav
          className="lg:hidden border-t border-gray-100 px-4 py-2 flex gap-3 overflow-x-auto text-sm"
          aria-label="Admin navigation"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-gray-600 hover:text-gray-900 whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
          {town && (
            <a
              href={`/${town.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
            >
              Preview ↗
            </a>
          )}
        </nav>
      </header>
      <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
