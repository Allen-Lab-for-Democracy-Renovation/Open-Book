import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ townId: string }> }
) {
  const { townId } = await params;

  const uploads = await prisma.upload.findMany({
    where: { townId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(uploads);
}
