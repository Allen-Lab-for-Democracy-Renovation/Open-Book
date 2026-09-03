import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cleanRows } from "@/lib/parser";
import { normalizeRows, stripZeroAmountRows } from "@/lib/normalizer";
import type { ColumnMappingInput } from "@/types";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await request.json();
  const { uploadId, mappings, rawData, confirmReplace } = body as {
    uploadId: string;
    mappings: ColumnMappingInput[];
    rawData: Record<string, string>[];
    confirmReplace?: boolean;
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

  // Clean raw data (strip totals, blanks, titles) then normalize
  const cleanedData = cleanRows({
    headers: Object.keys(rawData[0] || {}),
    rows: rawData,
  }).rows;
  const normalized = stripZeroAmountRows(normalizeRows(cleanedData, mappings));
  const incomingYears = [...new Set(normalized.map((r) => r.fiscalYear))];

  // Deduplicate: remove existing rows from OTHER uploads that share the same
  // town + category + fiscal year(s) to prevent duplication when the same
  // year is uploaded incrementally. Since this can delete data that came
  // from a completely different upload than the one being confirmed, check
  // for conflicts first and require explicit confirmation before doing so.
  const conflictingRows = await prisma.budgetRow.findMany({
    where: {
      townId: upload.townId,
      dataCategory: upload.dataCategory,
      fiscalYear: { in: incomingYears },
      uploadId: { not: uploadId },
    },
    select: { uploadId: true, fiscalYear: true },
  });

  if (conflictingRows.length > 0 && !confirmReplace) {
    const otherUploadIds = [...new Set(conflictingRows.map((r) => r.uploadId))];
    const otherUploads = await prisma.upload.findMany({
      where: { id: { in: otherUploadIds } },
      select: { id: true, fileName: true },
    });
    return NextResponse.json(
      {
        requiresConfirmation: true,
        affected: {
          rowCount: conflictingRows.length,
          fiscalYears: [...new Set(conflictingRows.map((r) => r.fiscalYear))].sort(),
          sources: otherUploads.map((u) => ({
            uploadId: u.id,
            fileName: u.fileName,
          })),
        },
      },
      { status: 409 }
    );
  }

  // Delete existing rows for this upload
  await prisma.budgetRow.deleteMany({ where: { uploadId } });

  if (conflictingRows.length > 0) {
    await prisma.budgetRow.deleteMany({
      where: {
        townId: upload.townId,
        dataCategory: upload.dataCategory,
        fiscalYear: { in: incomingYears },
        uploadId: { not: uploadId },
      },
    });
  }

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
