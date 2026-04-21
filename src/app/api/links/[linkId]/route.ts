import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;
  const body = await request.json();
  const { title, url, description, category, sortOrder } = body;

  // Validate URL if provided
  if (url !== undefined) {
    if (!url?.trim()) {
      return NextResponse.json(
        { error: "url cannot be empty" },
        { status: 400 }
      );
    }
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }
  }

  if (title !== undefined && !title?.trim()) {
    return NextResponse.json(
      { error: "title cannot be empty" },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title.trim();
  if (url !== undefined) data.url = url.trim();
  if (description !== undefined) data.description = description?.trim() || null;
  if (category !== undefined) data.category = category;
  if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

  try {
    const link = await prisma.supportingLink.update({
      where: { id: linkId },
      data,
    });
    return NextResponse.json(link);
  } catch {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;

  try {
    await prisma.supportingLink.delete({ where: { id: linkId } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }
}
