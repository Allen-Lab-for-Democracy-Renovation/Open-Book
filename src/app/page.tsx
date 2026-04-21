import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function HomePage() {
  const towns = await prisma.town.findMany({
    where: { published: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-5 sm:py-7">
          <p className="text-xs font-display font-medium uppercase tracking-widest text-gray-400 mb-2">
            Municipal Budget Transparency
          </p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-gray-900">
            OpenBook
          </h1>
          <p className="text-gray-500 mt-1.5 text-lg max-w-xl leading-relaxed">
            Your town&apos;s budget, explained clearly. See where your
            tax dollars go, explore every line item, and ask questions
            about anything you don&apos;t understand.
          </p>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <div className="max-w-3xl mx-auto w-full px-4 py-6">
        {towns.length === 0 ? (
          <div>
            <p className="text-gray-400 text-lg mb-6">No towns published yet.</p>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-display font-semibold text-gray-800 mb-3">
                Getting started
              </p>
              <ol className="text-sm text-gray-600 space-y-2.5 list-none">
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-display font-semibold flex items-center justify-center">1</span>
                  <span><Link href="/admin/register" className="underline font-medium text-gray-900">Create an admin account</Link></span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-display font-semibold flex items-center justify-center">2</span>
                  <span>Configure your town&apos;s name, colors, and contact info</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-display font-semibold flex items-center justify-center">3</span>
                  <span>Upload budget data (CSV or Excel from UMAS)</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-display font-semibold flex items-center justify-center">4</span>
                  <span>Your portal goes live for residents</span>
                </li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-sm font-display font-semibold uppercase tracking-wide text-gray-500">
              Town Portals
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {towns.map((town) => (
                <Link
                  key={town.id}
                  href={`/${town.slug}`}
                  className="group block bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-all duration-150"
                >
                  <div className="flex items-center gap-3">
                    {town.logoUrl ? (
                      <img
                        src={town.logoUrl}
                        alt=""
                        className="h-8 w-8 rounded object-contain"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-display font-bold"
                        style={{ backgroundColor: town.primaryColor }}
                      >
                        {town.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <span className="font-display font-semibold text-gray-900 group-hover:text-gray-700">
                        {town.name}
                      </span>
                      <p className="text-xs text-gray-400">View budget portal</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        </div>

        <div className="max-w-5xl mx-auto w-full px-4 pb-6">
          <div className="pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 flex flex-col">
                <h3 className="text-sm font-display font-semibold text-blue-900 mb-2">
                  Are you a resident?
                </h3>
                <p className="text-sm text-blue-800 leading-relaxed flex-1">
                  Explore your town&apos;s full budget &mdash; expenses,
                  revenues, charts, and downloadable data. Search line items,
                  export spreadsheets, or ask questions directly.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col">
                <h3 className="text-sm font-display font-semibold text-gray-900 mb-2">
                  Are you a town administrator?
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">
                  Upload budget data, customize branding, manage documents, and
                  respond to resident questions. Setup takes about 10 minutes.
                </p>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  <Link
                    href="/admin/login"
                    className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs font-display font-medium hover:bg-gray-800 transition-colors"
                  >
                    Sign In to Admin
                  </Link>
                  <Link
                    href="/admin/register"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-gray-600 rounded-md text-xs font-display font-medium hover:bg-gray-50 transition-colors"
                  >
                    Create Admin Account
                  </Link>
                  <Link
                    href="/docs"
                    className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors underline underline-offset-2"
                  >
                    Setup Guide
                  </Link>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col">
                <h3 className="text-sm font-display font-semibold text-gray-900 mb-2">
                  Are you a town employee?
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">
                  Submit capital expenditure requests and track their approval
                  status. Ask your administrator for the town slug.
                </p>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  <Link
                    href="/staff/login"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-gray-600 rounded-md text-xs font-display font-medium hover:bg-gray-50 transition-colors"
                  >
                    Staff Portal Sign In
                  </Link>
                  <Link
                    href="/staff/register"
                    className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors underline underline-offset-2"
                  >
                    Create Staff Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-4">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs text-gray-400">
            OpenBook is a municipal budget transparency platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
