import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PortalHeader from "@/components/portal/PortalHeader";

export default async function TownLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ townSlug: string }>;
}) {
  const { townSlug } = await params;
  const town = await prisma.town.findUnique({ where: { slug: townSlug } });

  if (!town || !town.published) return notFound();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PortalHeader
        townName={town.name}
        townSlug={town.slug}
        primaryColor={town.primaryColor}
        logoUrl={town.logoUrl}
      />
      <main
        id="main-content"
        className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8"
      >
        {children}
      </main>
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-2">
          {town.aboutText && (
            <p className="text-gray-500 text-xs max-w-xl mx-auto leading-relaxed">
              {town.aboutText}
            </p>
          )}
          <p className="text-xs text-gray-400">
            Powered by{" "}
            <span className="font-display font-medium">OpenBook</span>
            {town.contactEmail && (
              <>
                {" | "}
                <a
                  href={`mailto:${town.contactEmail}`}
                  className="text-gray-500 hover:text-gray-700 underline underline-offset-2"
                >
                  {town.contactEmail}
                </a>
              </>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
