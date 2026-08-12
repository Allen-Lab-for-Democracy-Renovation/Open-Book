import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ townId: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { townId } = await params;

  const uploads = await prisma.upload.findMany({
    where: { townId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(uploads);
}
