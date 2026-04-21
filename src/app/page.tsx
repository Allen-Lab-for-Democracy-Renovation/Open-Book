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
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
          <p className="text-xs font-display font-medium uppercase tracking-widest text-gray-400 mb-3">
            Municipal Budget Transparency
          </p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-gray-900">
            OpenBook
          </h1>
          <p className="text-gray-500 mt-2 text-lg max-w-xl leading-relaxed">
            Your town&apos;s budget, explained clearly. See where your
            tax dollars go, explore every line item, and ask questions
            about anything you don&apos;t understand.
          </p>
        </div>
      </header>

      <main id="main-content" className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        {towns.length === 0 ? (
          <div className="py-8">
            <p className="text-gray-400 text-lg mb-8">No towns published yet.</p>
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

        {/* Role-based guidance sections */}
        <div className="mt-14 pt-8 border-t border-gray-200 space-y-5">

          {/* Residents / community members */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h3 className="text-sm font-display font-semibold text-blue-900 mb-1.5">
              Are you a resident?
            </h3>
            <p className="text-sm text-blue-800 leading-relaxed mb-3">
              Click on your town above to see the full budget — expenses,
              revenues, capital projects, charts, and downloadable data. You
              can search any line item, export tables to a spreadsheet, or
              generate a complete budget book for printing. If something
              doesn&apos;t make sense, every portal has an &quot;Ask a
              Question&quot; form that goes straight to your town&apos;s
              finance office.
            </p>
          </div>

          {/* Town administrators */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-display font-semibold text-gray-900 mb-1.5">
              Are you a town administrator?
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              The admin dashboard lets you upload budget data (CSV or Excel),
              customize your portal&apos;s branding, add helpful tooltips for
              residents, manage supporting documents, and respond to resident
              questions. Setting up takes about 10 minutes — upload your file
              and OpenBook auto-detects the columns.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/login"
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-display font-medium hover:bg-gray-800 transition-colors"
              >
                Sign In to Admin
              </Link>
              <Link
                href="/admin/register"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-display font-medium hover:bg-gray-100 transition-colors"
              >
                Create Admin Account
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center px-4 py-2 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors underline underline-offset-2"
              >
                Setup Guide
              </Link>
            </div>
          </div>

          {/* Town staff */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-display font-semibold text-gray-900 mb-1.5">
              Are you a town employee?
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              The staff portal lets department heads and employees submit
              capital expenditure requests (new equipment, building repairs,
              vehicle replacements) for review by your town&apos;s finance
              office. You can track the status of your requests and see when
              they&apos;re approved. Ask your administrator for the town
              slug to register.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/staff/login"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-display font-medium hover:bg-gray-100 transition-colors"
              >
                Staff Portal Sign In
              </Link>
              <Link
                href="/staff/register"
                className="inline-flex items-center px-4 py-2 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors underline underline-offset-2"
              >
                Create Staff Account
              </Link>
            </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-gray-200 py-6">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs text-gray-400">
            OpenBook is a municipal budget transparency platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
