import Link from "next/link";

export const metadata = {
  title: "Documentation — OpenBook",
  description: "Setup guide and data format documentation for OpenBook",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            OpenBook
          </Link>
          <span className="text-gray-500 font-normal ml-1">Documentation</span>
        </div>
      </header>

      <main id="main-content" className="max-w-3xl mx-auto px-4 py-8 space-y-16">
        {/* Setup Guide */}
        <section>
          <h1 className="text-2xl font-semibold tracking-tight mb-6">
            Setup Guide
          </h1>

          <div className="prose prose-sm max-w-none space-y-6">
            <div>
              <h2 className="text-lg font-medium mt-8 mb-3">Prerequisites</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Node.js 20 LTS or later</li>
                <li>npm 9+</li>
                <li>A Postgres database connection string</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-medium mt-8 mb-3">Quick Start</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-3">
                <li>
                  <strong>Clone the repository</strong>
                  <pre className="mt-1 bg-gray-50 rounded-lg p-3 text-sm overflow-x-auto">
                    <code>git clone https://github.com/your-org/openbook.git{"\n"}cd openbook</code>
                  </pre>
                </li>
                <li>
                  <strong>Install dependencies</strong>
                  <pre className="mt-1 bg-gray-50 rounded-lg p-3 text-sm overflow-x-auto">
                    <code>npm install</code>
                  </pre>
                </li>
                <li>
                  <strong>Set environment variables</strong>
                  <pre className="mt-1 bg-gray-50 rounded-lg p-3 text-sm overflow-x-auto">
                    <code>cp .env.example .env.local{"\n"}# Edit .env.local with your Postgres DATABASE_URL</code>
                  </pre>
                  <p className="mt-1 text-sm text-gray-500">
                    A local Postgres database works, or you can use a free hosted
                    database from Vercel Storage, Neon, or Supabase.
                  </p>
                </li>
                <li>
                  <strong>Start the development server</strong>
                  <pre className="mt-1 bg-gray-50 rounded-lg p-3 text-sm overflow-x-auto">
                    <code>npm run dev</code>
                  </pre>
                  <p className="mt-1 text-sm text-gray-500">
                    Migrations are applied automatically before the server starts.
                  </p>
                </li>
              </ol>
            </div>

            <div>
              <h2 className="text-lg font-medium mt-8 mb-3">First-Time Setup</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>
                  Visit <code className="bg-gray-100 px-1 rounded">/admin/register</code> to
                  create an admin account. The first person to register becomes the admin.
                </li>
                <li>
                  Configure your town at{" "}
                  <code className="bg-gray-100 px-1 rounded">/admin/setup</code> (name, slug,
                  branding).
                </li>
                <li>
                  Upload budget data at{" "}
                  <code className="bg-gray-100 px-1 rounded">/admin/upload</code>.
                </li>
                <li>Map columns and confirm. Your portal is now live.</li>
              </ol>
            </div>

            <div>
              <h2 className="text-lg font-medium mt-8 mb-3">Environment Variables</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50">
                      <th scope="col" className="px-4 py-2 text-left font-medium">Variable</th>
                      <th scope="col" className="px-4 py-2 text-left font-medium">Required</th>
                      <th scope="col" className="px-4 py-2 text-left font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-2"><code>DATABASE_URL</code></td>
                      <td className="px-4 py-2">Yes</td>
                      <td className="px-4 py-2 text-gray-600">Postgres connection string used by the running app</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-2"><code>DIRECT_URL</code></td>
                      <td className="px-4 py-2">No</td>
                      <td className="px-4 py-2 text-gray-600">Direct Postgres connection string for migrations when using pooled databases</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Deployment Guide */}
        <section>
          <h1 className="text-2xl font-semibold tracking-tight mb-6">
            Deployment Guide
          </h1>

          <div className="prose prose-sm max-w-none space-y-6">
            <p className="text-gray-600">
              OpenBook uses Postgres in local and hosted environments. This section
              walks through the recommended Vercel deployment path.
            </p>

            <div>
              <h2 className="text-lg font-medium mt-8 mb-3">Deploying to Vercel (Recommended)</h2>
              <p className="text-gray-600 mb-3">
                Vercel is the easiest way to get OpenBook online. It auto-builds on every
                push to your main branch, handles SSL, and has a free tier that works fine
                for municipal portals.
              </p>
              <ol className="list-decimal list-inside text-gray-600 space-y-3">
                <li>
                  <strong>Fork the repository</strong>
                  <p className="mt-1 text-sm text-gray-500">
                    Go to{" "}
                    <code className="bg-gray-100 px-1 rounded">https://github.com/your-org/openbook</code>{" "}
                    and click <strong>Fork</strong>. This gives your town its own copy of the codebase.
                  </p>
                </li>
                <li>
                  <strong>Connect to Vercel</strong>
                  <p className="mt-1 text-sm text-gray-500">
                    Sign up at{" "}
                    <code className="bg-gray-100 px-1 rounded">vercel.com</code>, click{" "}
                    <strong>Add New Project</strong>, and import your forked repo. Vercel will
                    detect the Next.js framework automatically.
                  </p>
                </li>
                <li>
                  <strong>Create a Postgres database</strong>
                  <p className="mt-1 text-sm text-gray-500">
                    Use Vercel Storage, Neon, or Supabase. Their free tiers are enough
                    for testing one town&apos;s budget portal.
                  </p>
                </li>
                <li>
                  <strong>Add environment variables</strong>
                  <p className="mt-1 text-sm text-gray-500">
                    In the Vercel project settings, go to <strong>Environment Variables</strong> and add:
                  </p>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg">
                      <thead>
                        <tr className="bg-gray-50">
                          <th scope="col" className="px-4 py-2 text-left font-medium">Variable</th>
                          <th scope="col" className="px-4 py-2 text-left font-medium">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-gray-200">
                          <td className="px-4 py-2"><code>DATABASE_URL</code></td>
                          <td className="px-4 py-2 text-gray-600">
                            Your Postgres runtime connection string
                          </td>
                        </tr>
                        <tr className="border-t border-gray-200">
                          <td className="px-4 py-2"><code>DIRECT_URL</code></td>
                          <td className="px-4 py-2 text-gray-600">
                            Optional direct connection string for migrations
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    If the provider gives you both pooled and direct URLs, use the pooled
                    URL for <code className="bg-gray-100 px-1 rounded">DATABASE_URL</code>{" "}
                    and the direct URL for{" "}
                    <code className="bg-gray-100 px-1 rounded">DIRECT_URL</code>.
                  </p>
                </li>
                <li>
                  <strong>Deploy</strong>
                  <p className="mt-1 text-sm text-gray-500">
                    Click <strong>Deploy</strong>. Vercel builds the app and gives you a public URL
                    like{" "}
                    <code className="bg-gray-100 px-1 rounded">openbook-yourtown.vercel.app</code>.
                    Every push to your main branch triggers a new deployment automatically.
                  </p>
                </li>
              </ol>
            </div>

            <div>
              <h2 className="text-lg font-medium mt-8 mb-3">Custom Domain Setup</h2>
              <p className="text-gray-600 mb-3">
                Once your portal is deployed, you can point a real domain at it.
              </p>
              <ol className="list-decimal list-inside text-gray-600 space-y-3">
                <li>
                  <strong>Add the domain in Vercel</strong>
                  <p className="mt-1 text-sm text-gray-500">
                    Go to your project&apos;s <strong>Settings → Domains</strong> and add your
                    domain (e.g.,{" "}
                    <code className="bg-gray-100 px-1 rounded">budget.townname.gov</code>).
                  </p>
                </li>
                <li>
                  <strong>Add a CNAME record in your DNS provider</strong>
                  <p className="mt-1 text-sm text-gray-500">
                    Create a CNAME record pointing to:
                  </p>
                  <pre className="mt-1 bg-gray-50 rounded-lg p-3 text-sm overflow-x-auto">
                    <code>cname.vercel-dns.com</code>
                  </pre>
                  <p className="mt-1 text-sm text-gray-500">
                    For <code className="bg-gray-100 px-1 rounded">.gov</code> subdomains,
                    your IT department sets this in the town&apos;s DNS management. For domains on
                    GoDaddy, Namecheap, Cloudflare, etc., do the same thing in their DNS panel.
                  </p>
                </li>
                <li>
                  <strong>SSL is automatic</strong>
                  <p className="mt-1 text-sm text-gray-500">
                    Vercel provisions and renews SSL certificates automatically once the DNS
                    record propagates. No extra configuration needed.
                  </p>
                </li>
              </ol>
            </div>

            <div>
              <h2 className="text-lg font-medium mt-8 mb-3">IT Department Handoff</h2>
              <p className="text-gray-600 mb-3">
                In most towns, the person setting up OpenBook (town manager, finance director)
                is not the same person who manages DNS and hosting. Here&apos;s how the work splits:
              </p>

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">What the town manager does:</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Fork the OpenBook repo to the town&apos;s GitHub account</li>
                  <li>Run the app locally and create the admin account</li>
                  <li>Configure the town name, slug, and branding</li>
                  <li>Upload budget data and verify everything looks right</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">What IT does:</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Connect the forked repo to Vercel</li>
                  <li>Set up a Postgres database</li>
                  <li>Add <code className="bg-gray-100 px-1 rounded">DATABASE_URL</code> and, if needed, <code className="bg-gray-100 px-1 rounded">DIRECT_URL</code> in Vercel</li>
                  <li>Point the subdomain (e.g., <code className="bg-gray-100 px-1 rounded">budget.townname.gov</code>) via CNAME</li>
                  <li>Verify the deployment is live and SSL is working</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">IT Handoff Checklist</h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-2">
                  <li>
                    Fork the repo at{" "}
                    <code className="bg-gray-100 px-1 rounded">https://github.com/your-org/openbook</code>
                  </li>
                  <li>
                    Create a Vercel account and import the forked repo
                  </li>
                  <li>
                    Provision a Postgres database through Vercel Storage, Neon, or Supabase
                  </li>
                  <li>
                    Add the runtime connection string as{" "}
                    <code className="bg-gray-100 px-1 rounded">DATABASE_URL</code> in Vercel
                    environment variables. If the provider gives a direct connection string,
                    add it as <code className="bg-gray-100 px-1 rounded">DIRECT_URL</code>.
                  </li>
                  <li>Deploy — Vercel builds automatically on push</li>
                  <li>
                    Add custom domain in Vercel and set the CNAME record to{" "}
                    <code className="bg-gray-100 px-1 rounded">cname.vercel-dns.com</code>
                  </li>
                  <li>Wait for DNS propagation and confirm SSL is active</li>
                  <li>
                    Have the town manager log in, re-upload budget data, and verify the public portal
                  </li>
                </ol>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mt-8 mb-3">Alternative Hosting</h2>
              <p className="text-gray-600 mb-3">
                Vercel is the path of least resistance, but OpenBook is a standard Next.js app.
                You can host it anywhere that runs Node.js.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  <strong>Railway</strong> (<code className="bg-gray-100 px-1 rounded">railway.app</code>)
                  — connect your repo, add <code className="bg-gray-100 px-1 rounded">DATABASE_URL</code>,
                  and Railway handles the rest.
                </li>
                <li>
                  <strong>Render</strong> (<code className="bg-gray-100 px-1 rounded">render.com</code>)
                  — similar flow. Create a Web Service, point it at your repo, set environment variables.
                </li>
                <li>
                  <strong>Self-hosted</strong> — build and run it yourself:
                  <pre className="mt-1 bg-gray-50 rounded-lg p-3 text-sm overflow-x-auto">
                    <code>{`npm run build
npm start`}</code>
                  </pre>
                  <p className="mt-1 text-sm text-gray-500">
                    The app listens on port 3000 by default. Put it behind nginx or Caddy
                    for SSL termination.
                  </p>
                </li>
              </ul>
              <p className="text-sm text-gray-500 mt-3">
                Regardless of hosting provider, set{" "}
                <code className="bg-gray-100 px-1 rounded">DATABASE_URL</code> before building.
                The build command runs migrations automatically.
              </p>
            </div>
          </div>
        </section>

        {/* Data Format Guide */}
        <section>
          <h1 className="text-2xl font-semibold tracking-tight mb-6">
            Budget Data Format
          </h1>

          <div className="prose prose-sm max-w-none space-y-6">
            <p className="text-gray-600">
              OpenBook accepts budget data in CSV (.csv) or Excel (.xlsx) format.
              Upload one file per data category (expenses, revenues, capital).
            </p>

            <div>
              <h2 className="text-lg font-medium mt-8 mb-3">General Rules</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Files must have a header row with column names</li>
                <li>Maximum file size: 10MB</li>
                <li>Each column must have a unique name</li>
                <li>Empty rows are automatically skipped</li>
                <li>Dollar signs, commas, and parentheses in amounts are handled automatically</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-medium mt-8 mb-3">Amount Columns</h2>
              <p className="text-gray-600 mb-3">
                OpenBook recognizes fiscal year amounts in column headers:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">FY2026 Budget</code></li>
                <li><code className="bg-gray-100 px-1 rounded">FY25 Actual</code></li>
                <li><code className="bg-gray-100 px-1 rounded">2026 Appropriation</code></li>
                <li><code className="bg-gray-100 px-1 rounded">Adopted 2026</code></li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-medium mt-8 mb-3">Sample: Expenses CSV</h2>
              <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
                <code>{`Dept,Function,Description,Object Code,FY2024 Actual,FY2025 Budget,FY2026 Budget
Selectmen,General Government,Town Admin Salary,5110,165000,170000,175000
Police,Public Safety,Chief Salary,5110,145000,150000,155000
Police,Public Safety,Patrol Salaries,5110,680000,710000,740000`}</code>
              </pre>
            </div>

            <div>
              <h2 className="text-lg font-medium mt-8 mb-3">Sample: Revenues CSV</h2>
              <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
                <code>{`Category,Source,Description,FY2025 Actual,FY2026 Budget
Tax Levy,Property Tax,Real Estate Tax,28500000,29200000
State Aid,Chapter 70,School Aid,5200000,5350000
Local Receipts,Motor Vehicle,MV Excise,1800000,1850000`}</code>
              </pre>
            </div>

            <div>
              <h2 className="text-lg font-medium mt-8 mb-3">Sample: Capital CSV</h2>
              <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
                <code>{`Department,Purpose,FY2026 Budget,Funding Source
DPW,Road Resurfacing Program,500000,Free Cash
Fire,Engine Replacement,350000,Borrowing
Schools,HVAC Replacement,200000,Capital Stabilization`}</code>
              </pre>
            </div>

            <div>
              <h2 className="text-lg font-medium mt-8 mb-3">UMAS (Uniform Municipal Accounting System)</h2>
              <p className="text-gray-600 mb-3">
                Massachusetts towns report financials using the UMAS format. OpenBook
                is designed to work with UMAS exports. To upload your UMAS data:
              </p>
              <ol className="list-decimal list-inside text-gray-600 space-y-2 mb-3">
                <li>Export your Schedule A data from your accounting system as a CSV or Excel file.</li>
                <li>Make sure the export includes column headers (Department, Function Area, Object Code, amounts by fiscal year).</li>
                <li>On the upload page, select the matching category (Expenses, Revenues, or Capital).</li>
                <li>OpenBook will auto-detect common UMAS header patterns like &quot;FY2026 Budget&quot; and &quot;Object Code&quot;.</li>
                <li>Review the auto-detected mappings and correct any that look wrong.</li>
              </ol>
              <p className="text-gray-600 mb-3">
                UMAS expenditure categories map to OpenBook fields as follows:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50">
                      <th scope="col" className="px-4 py-2 text-left font-medium">UMAS Column</th>
                      <th scope="col" className="px-4 py-2 text-left font-medium">OpenBook Mapping</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-2">Department / Dept</td>
                      <td className="px-4 py-2">Department</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-2">Function / Functional Area</td>
                      <td className="px-4 py-2">Function Area</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-2">Object Code / Account Code</td>
                      <td className="px-4 py-2">Account / Object Code</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-2">Description / Line Item</td>
                      <td className="px-4 py-2">Line Item / Description</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-2">FY20XX Budget / Appropriation</td>
                      <td className="px-4 py-2">Fiscal Year Amount (type: Budget)</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-2">FY20XX Actual / Expenditure</td>
                      <td className="px-4 py-2">Fiscal Year Amount (type: Actual)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                The DOR Schedule A format from the Massachusetts Division of Local Services also works.
                Export your town&apos;s data from the DOR gateway and upload directly.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-medium mt-8 mb-3">Common Issues</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  <strong>&quot;File has only 1 column&quot;</strong> — Your CSV may use semicolons instead of commas.
                  Convert to comma-separated format.
                </li>
                <li>
                  <strong>&quot;Duplicate column names&quot;</strong> — Each column must have a unique header.
                </li>
                <li>
                  <strong>No fiscal year detected</strong> — Include the year in amount column headers
                  (e.g., &quot;FY2026 Budget&quot;) or add a separate &quot;Fiscal Year&quot; column.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        OpenBook — Municipal Budget Transparency
      </footer>
    </div>
  );
}
