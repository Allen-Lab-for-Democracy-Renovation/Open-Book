import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ townId: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { townId } = await params;
  const body = await request.json();
  const { name, slug, primaryColor, logoUrl, contactEmail, aboutText, allowedDomains } = body;

  const town = await prisma.town.findUnique({ where: { id: townId } });
  if (!town) {
    return NextResponse.json({ error: "Town not found" }, { status: 404 });
  }

  // If slug changed, check uniqueness
  if (slug && slug !== town.slug) {
    const existing = await prisma.town.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A town with this slug already exists" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.town.update({
    where: { id: townId },
    data: {
      ...(name !== undefined && { name }),
      ...(slug !== undefined && { slug }),
      ...(primaryColor !== undefined && { primaryColor }),
      ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
      ...(contactEmail !== undefined && { contactEmail: contactEmail || null }),
      ...(aboutText !== undefined && { aboutText: aboutText || null }),
      ...(allowedDomains !== undefined && { allowedDomains: allowedDomains || "" }),
    },
  });

  return NextResponse.json(updated);
}
