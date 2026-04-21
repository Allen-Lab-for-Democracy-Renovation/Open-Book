import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  const { uploadId } = await params;

  const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
  if (!upload) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  // Delete associated budget rows first, then the upload
  await prisma.budgetRow.deleteMany({ where: { uploadId } });
  await prisma.upload.delete({ where: { id: uploadId } });

  // Check if town still has any data
  const remaining = await prisma.budgetRow.count({
    where: { townId: upload.townId },
  });

  if (remaining === 0) {
    await prisma.town.update({
      where: { id: upload.townId },
      data: { published: false },
    });
  }

  return NextResponse.json({ success: true, remainingRows: remaining });
}
