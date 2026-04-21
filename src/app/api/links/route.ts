import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const townId = searchParams.get("townId");

  if (!townId) {
    return NextResponse.json({ error: "townId is required" }, { status: 400 });
  }

  const links = await prisma.supportingLink.findMany({
    where: { townId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(links);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { townId, title, url, description, category } = body;

  if (!townId || !title?.trim()) {
    return NextResponse.json(
      { error: "townId and title are required" },
      { status: 400 }
    );
  }

  if (!url?.trim()) {
    return NextResponse.json(
      { error: "url is required" },
      { status: 400 }
    );
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "Invalid URL format" },
      { status: 400 }
    );
  }

  const link = await prisma.supportingLink.create({
    data: {
      townId,
      title: title.trim(),
      url: url.trim(),
      description: description?.trim() || null,
      category: category || "other",
    },
  });

  return NextResponse.json(link, { status: 201 });
}
