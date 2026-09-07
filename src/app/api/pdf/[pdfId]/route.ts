import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { unlink } from "fs/promises";
import { join } from "path";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ pdfId: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { pdfId } = await params;

  const pdf = await prisma.pdfDocument.findUnique({
    where: { id: pdfId },
    select: { id: true, filePath: true },
  });

  if (!pdf) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }

  // Documents uploaded before files moved into the database still have a copy
  // on disk. Best-effort cleanup; the file may be gone or the filesystem
  // read-only, neither of which should block removing the record.
  if (pdf.filePath) {
    try {
      await unlink(join(process.cwd(), "public", pdf.filePath));
    } catch {
      // Nothing to clean up.
    }
  }

  await prisma.pdfDocument.delete({ where: { id: pdfId } });

  return NextResponse.json({ deleted: true });
}
