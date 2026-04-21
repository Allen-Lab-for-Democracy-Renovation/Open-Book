import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const townId = searchParams.get("townId");

  if (!townId) {
    return NextResponse.json({ error: "townId is required" }, { status: 400 });
  }

  const pdfs = await prisma.pdfDocument.findMany({
    where: { townId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(pdfs);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const townId = formData.get("townId") as string | null;
  const title = formData.get("title") as string | null;
  const category = formData.get("category") as string | null;

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!townId) {
    return NextResponse.json({ error: "townId is required" }, { status: 400 });
  }

  // Validate file type
  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are allowed" },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File size exceeds 50MB limit" },
      { status: 400 }
    );
  }

  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  // Generate a random filename to avoid collisions
  const ext = ".pdf";
  const randomName = `${randomUUID()}${ext}`;
  const filePath = join(uploadsDir, randomName);

  // Write file to disk
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Create database record
  const pdfDoc = await prisma.pdfDocument.create({
    data: {
      townId,
      fileName: file.name,
      filePath: `/uploads/${randomName}`,
      fileSize: file.size,
      title: title?.trim() || null,
      category: category || "other",
    },
  });

  return NextResponse.json(pdfDoc, { status: 201 });
}
