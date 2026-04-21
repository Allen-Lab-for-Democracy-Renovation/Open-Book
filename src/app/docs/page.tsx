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
          <span className="text-gray-400 font-normal ml-1">Documentation</span>
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
                <li>Node.js 18+ (recommended: 20 LTS)</li>
                <li>npm 9+</li>
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
                  <strong>Configure environment</strong>
                  <pre className="mt-1 bg-gray-50 rounded-lg p-3 text-sm overflow-x-auto">
                    <code>cp .env.example .env</code>
                  </pre>
                  <p className="mt-1 text-sm text-gray-500">
                    Set <code className="bg-gray-100 px-1 rounded">DATABASE_URL</code> and{" "}
                    <code className="bg-gray-100 px-1 rounded">SETUP_KEY</code> in your{" "}
                    <code className="bg-gray-100 px-1 rounded">.env</code> file.
                  </p>
                </li>
                <li>
                  <strong>Run database migrations</strong>
                  <pre className="mt-1 bg-gray-50 rounded-lg p-3 text-sm overflow-x-auto">
                    <code>npx prisma migrate dev</code>
                  </pre>
                </li>
                <li>
                  <strong>Start the development server</strong>
                  <pre className="mt-1 bg-gray-50 rounded-lg p-3 text-sm overflow-x-auto">
                    <code>npm run dev</code>
                  </pre>
                </li>
              </ol>
            </div>

            <div>
              <h2 className="text-lg font-medium mt-8 mb-3">First-Time Setup</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>
                  Visit <code className="bg-gray-100 px-1 rounded">/admin/register</code> and
                  create an admin account using your setup key.
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
                      <th className="px-4 py-2 text-left font-medium">Variable</th>
                      <th className="px-4 py-2 text-left font-medium">Required</th>
                      <th className="px-4 py-2 text-left font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-2"><code>DATABASE_URL</code></td>
                      <td className="px-4 py-2">Yes</td>
                      <td className="px-4 py-2 text-gray-600">SQLite database file path</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-2"><code>SETUP_KEY</code></td>
                      <td className="px-4 py-2">Yes</td>
                      <td className="px-4 py-2 text-gray-600">Secret key for creating admin accounts</td>
                    </tr>
                  </tbody>
                </table>
              </div>
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

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        OpenBook — Municipal Budget Transparency
      </footer>
    </div>
  );
}
