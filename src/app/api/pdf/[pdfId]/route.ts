import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ pdfId: string }> }
) {
  const { pdfId } = await params;

  let pdf;
  try {
    pdf = await prisma.pdfDocument.findUniqueOrThrow({ where: { id: pdfId } });
  } catch {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }

  // Delete file from disk
  try {
    const fullPath = join(process.cwd(), "public", pdf.filePath);
    await unlink(fullPath);
  } catch {
    // File may already be missing; continue with DB cleanup
  }

  // Delete database record
  await prisma.pdfDocument.delete({ where: { id: pdfId } });

  return NextResponse.json({ deleted: true });
}
