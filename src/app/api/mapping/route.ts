import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseCSV, parseExcel } from "@/lib/parser";
import { normalizeRows } from "@/lib/normalizer";
import type { ColumnMappingInput } from "@/types";

export async function POST(request: Request) {
  const body = await request.json();
  const { uploadId, mappings, rawData } = body as {
    uploadId: string;
    mappings: ColumnMappingInput[];
    rawData: Record<string, string>[];
  };

  if (!uploadId || !mappings || !rawData) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
  if (!upload) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  // Save column mappings
  for (const m of mappings) {
    if (m.targetField === "skip") continue;
    await prisma.columnMapping.upsert({
      where: {
        townId_dataCategory_sourceColumn: {
          townId: upload.townId,
          dataCategory: upload.dataCategory,
          sourceColumn: m.sourceColumn,
        },
      },
      update: {
        targetField: m.targetField,
        confirmed: true,
        confidence: 1.0,
      },
      create: {
        townId: upload.townId,
        dataCategory: upload.dataCategory,
        sourceColumn: m.sourceColumn,
        targetField: m.targetField,
        confirmed: true,
        confidence: 1.0,
      },
    });
  }

  // Normalize and store budget rows
  const normalized = normalizeRows(rawData, mappings);

  // Delete existing rows for this upload
  await prisma.budgetRow.deleteMany({ where: { uploadId } });

  // Insert normalized rows
  if (normalized.length > 0) {
    await prisma.budgetRow.createMany({
      data: normalized.map((row) => ({
        townId: upload.townId,
        uploadId,
        dataCategory: upload.dataCategory,
        ...row,
      })),
    });
  }

  // Update upload status
  await prisma.upload.update({
    where: { id: uploadId },
    data: { status: "mapped", rowCount: normalized.length },
  });

  // Publish the town
  await prisma.town.update({
    where: { id: upload.townId },
    data: { published: true },
  });

  return NextResponse.json({
    success: true,
    rowsCreated: normalized.length,
    townSlug: (await prisma.town.findUnique({ where: { id: upload.townId } }))?.slug,
  });
}
