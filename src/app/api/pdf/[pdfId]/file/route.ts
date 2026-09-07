import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Strips anything that could break out of the Content-Disposition header.
function safeFilename(name: string): string {
  const cleaned = name.replace(/[^\w.\- ]+/g, "_").trim();
  return cleaned.length > 0 ? cleaned.slice(0, 100) : "document.pdf";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pdfId: string }> }
) {
  const { pdfId } = await params;

  const pdf = await prisma.pdfDocument.findUnique({
    where: { id: pdfId },
    select: { fileName: true, fileData: true, town: { select: { published: true } } },
  });

  if (!pdf) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Residents only see documents for a published portal; an admin can preview
  // their own documents before the portal goes live.
  if (!pdf.town.published && !(await getCurrentUser())) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!pdf.fileData) {
    // Uploaded before documents moved into the database; the file lived on
    // disk and is not recoverable from here.
    return NextResponse.json(
      { error: "This document is no longer available. Please re-upload it." },
      { status: 404 }
    );
  }

  return new NextResponse(new Uint8Array(pdf.fileData), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.fileData.length),
      "Content-Disposition": `inline; filename="${safeFilename(pdf.fileName)}"`,
      "Cache-Control": pdf.town.published
        ? "public, max-age=3600"
        : "private, no-store",
    },
  });
}
