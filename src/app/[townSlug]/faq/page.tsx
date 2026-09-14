import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function FaqPage({
  params,
}: {
  params: Promise<{ townSlug: string }>;
}) {
  const { townSlug } = await params;
  const town = await prisma.town.findUnique({ where: { slug: townSlug } });
  if (!town) return notFound();

  let faqs: { id: string; question: string; answer: string; sortOrder: number }[] = [];
  try {
    faqs = await prisma.faqEntry.findMany({
      where: { townId: town.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  } catch {
    // Table may not exist if migration hasn't been applied yet
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-gray-600 mt-1">
          Answers to common questions about {town.name}&apos;s budget.
        </p>
      </div>

      {faqs.length > 0 ? (
        <div className="space-y-2">
          {faqs.map((faq) => (
            <details
              key={faq.id}
              className="group bg-white border border-gray-200 rounded-lg open:shadow-sm"
            >
              <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3 text-sm font-medium text-gray-900">
                <span>{faq.question}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </summary>
              <div className="px-4 pb-4 -mt-1 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-600">
            No FAQs have been published yet. Check back soon.
          </p>
        </div>
      )}

      {town.contactEmail && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-5">
          <p className="text-sm text-blue-900 leading-relaxed">
            <strong>Don&apos;t see your question?</strong> Please contact{" "}
            {town.name}&apos;s finance office at{" "}
            <a
              href={`mailto:${town.contactEmail}`}
              className="underline hover:text-blue-700"
            >
              {town.contactEmail}
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
