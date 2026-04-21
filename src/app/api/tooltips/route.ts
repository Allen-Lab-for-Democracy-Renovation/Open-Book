import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const townId = searchParams.get("townId");

  if (!townId) {
    return NextResponse.json({ error: "townId is required" }, { status: 400 });
  }

  const tooltips = await prisma.tooltip.findMany({
    where: { townId },
    orderBy: [{ scope: "asc" }, { key: "asc" }],
  });

  return NextResponse.json(tooltips);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { townId, scope, key, text } = body;

  if (!townId || !scope || !key) {
    return NextResponse.json(
      { error: "townId, scope, and key are required" },
      { status: 400 }
    );
  }

  if (!text || !text.trim()) {
    // If text is empty, delete the tooltip
    await prisma.tooltip.deleteMany({
      where: { townId, scope, key },
    });
    return NextResponse.json({ deleted: true });
  }

  const tooltip = await prisma.tooltip.upsert({
    where: {
      townId_scope_key: { townId, scope, key },
    },
    update: { text: text.trim() },
    create: {
      townId,
      scope,
      key,
      text: text.trim(),
    },
  });

  return NextResponse.json(tooltip);
}
