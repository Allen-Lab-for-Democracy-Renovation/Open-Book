import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
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

  const navItems = [
    { href: "/admin/setup", label: "Settings" },
    { href: "/admin/upload", label: "Upload" },
    { href: "/admin/data", label: "Data" },
    { href: "/admin/tooltips", label: "Tooltips" },
    { href: "/admin/links", label: "Links" },
    { href: "/admin/documents", label: "PDFs" },
    { href: "/admin/questions", label: "Questions" },
    { href: "/admin/requests", label: "Requests" },
    { href: "/admin/transfer", label: "Transfer" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin/setup" className="text-lg font-semibold tracking-tight shrink-0">
            OpenBook <span className="text-gray-400 font-normal">Admin</span>
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
        </nav>
      </header>
      <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
