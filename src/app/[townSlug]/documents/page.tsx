import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

const CATEGORY_LABELS: Record<string, string> = {
  budget: "Budget Documents",
  meeting: "Meeting Minutes",
  report: "Reports",
  press: "Press Releases",
  other: "Other Documents",
};

const CATEGORY_ORDER = ["budget", "meeting", "report", "press", "other"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ townSlug: string }>;
}) {
  const { townSlug } = await params;
  const town = await prisma.town.findUnique({ where: { slug: townSlug } });
  if (!town) return notFound();

  const [links, pdfs] = await Promise.all([
    prisma.supportingLink.findMany({
      where: { townId: town.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.pdfDocument.findMany({
      where: { townId: town.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const hasContent = links.length > 0 || pdfs.length > 0;

  // Group links and PDFs by category
  const linksByCategory: Record<string, typeof links> = {};
  for (const link of links) {
    const cat = link.category || "other";
    if (!linksByCategory[cat]) linksByCategory[cat] = [];
    linksByCategory[cat].push(link);
  }

  const pdfsByCategory: Record<string, typeof pdfs> = {};
  for (const pdf of pdfs) {
    const cat = pdf.category || "other";
    if (!pdfsByCategory[cat]) pdfsByCategory[cat] = [];
    pdfsByCategory[cat].push(pdf);
  }

  // Determine which categories have content
  const activeCategories = CATEGORY_ORDER.filter(
    (cat) =>
      (linksByCategory[cat] && linksByCategory[cat].length > 0) ||
      (pdfsByCategory[cat] && pdfsByCategory[cat].length > 0)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Documents & Resources
        </h1>
        <p className="text-gray-500 mt-1">
          Supporting documents, reports, and links for {town.name}
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 leading-relaxed">
          <strong>Source documents and references.</strong>{" "}
          This page collects the original budget documents, meeting
          minutes, press releases, and other materials that support
          the data you see on this portal. PDFs can be downloaded
          directly; links open in a new tab. If you&apos;re looking for
          a document that isn&apos;t here, use the{" "}
          <a href={`/${townSlug}/ask`} className="underline font-medium">Ask a Question</a>{" "}
          form to let us know.
        </p>
      </div>

      {!hasContent && (
        <div className="text-center py-16">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <p className="mt-4 text-gray-500">No documents available yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Check back later for budget documents, meeting minutes, and other
            resources.
          </p>
        </div>
      )}

      {activeCategories.map((cat) => {
        const catLinks = linksByCategory[cat] || [];
        const catPdfs = pdfsByCategory[cat] || [];

        return (
          <section key={cat}>
            <h2 className="text-lg font-medium mb-4">
              {CATEGORY_LABELS[cat] || cat}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {catLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 text-gray-400 mt-0.5 shrink-0 group-hover:text-blue-500 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.04a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.343 8.07"
                      />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {link.title}
                      </p>
                      {link.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {link.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {link.url}
                      </p>
                    </div>
                  </div>
                </a>
              ))}

              {catPdfs.map((pdf) => (
                <a
                  key={pdf.id}
                  href={pdf.filePath}
                  download={pdf.fileName}
                  className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 text-red-400 mt-0.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {pdf.title || pdf.fileName}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF &middot; {formatFileSize(pdf.fileSize)}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
