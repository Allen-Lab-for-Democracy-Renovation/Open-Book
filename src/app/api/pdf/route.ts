import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { MAX_PDF_SIZE, MAX_PDF_SIZE_LABEL } from "@/lib/upload-limits";

// Documents are stored in the database rather than on disk. Hosts like Vercel
// have a read-only filesystem outside /tmp, and container hosts without a
// mounted volume discard anything written at runtime on the next deploy — so
// a file on disk and its database row drift apart silently.
// Metadata only; never select fileData in list queries.
const DOCUMENT_FIELDS = {
  id: true,
  townId: true,
  fileName: true,
  filePath: true,
  fileSize: true,
  title: true,
  description: true,
  category: true,
  createdAt: true,
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const townId = searchParams.get("townId");

  if (!townId) {
    return NextResponse.json({ error: "townId is required" }, { status: 400 });
  }

  const pdfs = await prisma.pdfDocument.findMany({
    where: { townId },
    select: DOCUMENT_FIELDS,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(pdfs);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const townId = formData.get("townId") as string | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string | null;

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!townId) {
      return NextResponse.json({ error: "townId is required" }, { status: 400 });
    }

    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        {
          error: `This file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The maximum is ${MAX_PDF_SIZE_LABEL}. For larger documents, host the file on your municipality's website and add it as a link instead.`,
        },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "That file is empty" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // Check the actual contents, not the filename or the browser-supplied type.
    if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const pdfDoc = await prisma.pdfDocument.create({
      data: {
        townId,
        fileName: file.name,
        fileData: bytes,
        fileSize: bytes.length,
        title: title?.trim() || null,
        description: description?.trim() || null,
        category: category || "other",
      },
      select: DOCUMENT_FIELDS,
    });

    return NextResponse.json(pdfDoc, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not save that document. Please try again." },
      { status: 500 }
    );
  }
}
