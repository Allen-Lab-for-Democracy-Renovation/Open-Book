import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const towns = await prisma.town.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, primaryColor: true, published: true },
  });
  return NextResponse.json(towns);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, slug, primaryColor } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
  }

  const existing = await prisma.town.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A town with this slug already exists" }, { status: 409 });
  }

  const town = await prisma.town.create({
    data: {
      name,
      slug,
      primaryColor: primaryColor || "#1e40af",
      inviteCode: "",
    },
  });

  return NextResponse.json(town, { status: 201 });
}
