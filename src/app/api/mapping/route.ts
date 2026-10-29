import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFileType, parseUploadedFile } from "@/lib/parser";
import { decodeDataFile, DataFileTooLargeError } from "@/lib/data-file-transfer";
import { MAX_DATA_FILE_SIZE, MAX_DATA_FILE_SIZE_LABEL } from "@/lib/upload-limits";
import { normalizeRows, stripZeroAmountRows } from "@/lib/normalizer";
import type { ColumnMappingInput, DataCategory } from "@/types";
import { requireAdmin } from "@/lib/auth";

// Large files can take a while to insert. Vercel stops functions after 10s by
// default; 60s is the most every plan allows.
export const maxDuration = 60;

// Rows per INSERT, to stay well under Postgres's bind-parameter limit.
const INSERT_BATCH_SIZE = 2000;

const DATA_CATEGORIES: DataCategory[] = ["expenses", "revenues", "capital", "reserves"];

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  // The admin's original file is sent again and parsed here with the same
  // parser /api/upload used for the preview. (The browser used to re-parse it
  // as CSV text, which garbled .xlsx files.)
  const formData = await request.formData();
  const sentFile = formData.get("file") as File | null;
  const townId = formData.get("townId") as string | null;
  const dataCategory = formData.get("dataCategory") as DataCategory | null;
  const mappingsJson = formData.get("mappings") as string | null;
  const confirmReplace = formData.get("confirmReplace") === "true";

  if (!sentFile || !townId || !dataCategory || !mappingsJson) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!DATA_CATEGORIES.includes(dataCategory)) {
    return NextResponse.json({ error: "Unknown data category" }, { status: 400 });
  }

  let file: File;
  try {
    file = await decodeDataFile(sentFile, formData.get("encoding"));
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof DataFileTooLargeError
            ? `File is too large. Maximum size is ${MAX_DATA_FILE_SIZE_LABEL}.`
            : "Could not read the uploaded file. Please try again.",
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_DATA_FILE_SIZE) {
    return NextResponse.json(
      { error: `File is too large. Maximum size is ${MAX_DATA_FILE_SIZE_LABEL}.` },
      { status: 400 }
    );
  }

  let mappings: ColumnMappingInput[];
  try {
    mappings = JSON.parse(mappingsJson);
  } catch {
    return NextResponse.json({ error: "Invalid column mappings" }, { status: 400 });
  }

  const town = await prisma.town.findUnique({ where: { id: townId } });
  if (!town) {
    return NextResponse.json({ error: "Town not found" }, { status: 404 });
  }

  let headers: string[];
  let rows: Record<string, string>[];
  try {
    ({ headers, rows } = await parseUploadedFile(file));
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Could not read file contents. Check the format.",
      },
      { status: 400 }
    );
  }

  // Save column mappings
  for (const m of mappings) {
    if (m.targetField === "skip") continue;
    await prisma.columnMapping.upsert({
      where: {
        townId_dataCategory_sourceColumn: {
          townId,
          dataCategory,
          sourceColumn: m.sourceColumn,
        },
      },
      update: {
        targetField: m.targetField,
        confirmed: true,
        confidence: 1.0,
      },
      create: {
        townId,
        dataCategory,
        sourceColumn: m.sourceColumn,
        targetField: m.targetField,
        confirmed: true,
        confidence: 1.0,
      },
    });
  }

  // parseUploadedFile already stripped totals, blanks and titles
  const normalized = stripZeroAmountRows(normalizeRows(rows, mappings));

  // Nothing usable in the file: save nothing, so no empty upload is listed
  // and the town isn't published with nothing to show.
  if (normalized.length === 0) {
    return NextResponse.json({ success: true, rowsCreated: 0, townSlug: town.slug });
  }

  const incomingYears = [...new Set(normalized.map((r) => r.fiscalYear))];

  // Deduplicate: remove existing rows from OTHER uploads that share the same
  // town + category + fiscal year(s) to prevent duplication when the same
  // year is uploaded incrementally. Since this can delete data that came
  // from a completely different upload than the one being confirmed, check
  // for conflicts first and require explicit confirmation before doing so.
  const conflictingRows = await prisma.budgetRow.findMany({
    where: {
      townId,
      dataCategory,
      fiscalYear: { in: incomingYears },
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

  const replacedUploadIds = [...new Set(conflictingRows.map((r) => r.uploadId))];

  // Save as one all-or-nothing transaction: the upload record, the replaced
  // rows and the new rows. If any step fails (a timeout, a dropped
  // connection, a rejected row), every change is rolled back, so the portal
  // keeps the data it had and no half-saved upload is left on the Data tab.
  try {
    await prisma.$transaction(
      async (tx) => {
        if (replacedUploadIds.length > 0) {
          await tx.budgetRow.deleteMany({
            where: {
              townId,
              dataCategory,
              fiscalYear: { in: incomingYears },
            },
          });
          // Those uploads lost some rows: update their counts on the Data tab,
          // and remove any that were replaced entirely.
          for (const id of replacedUploadIds) {
            const remaining = await tx.budgetRow.count({ where: { uploadId: id } });
            if (remaining === 0) {
              await tx.upload.delete({ where: { id } });
            } else {
              await tx.upload.update({ where: { id }, data: { rowCount: remaining } });
            }
          }
        }

        const upload = await tx.upload.create({
          data: {
            townId,
            fileName: file.name,
            fileType: getFileType(file.name),
            dataCategory,
            rowCount: normalized.length,
            status: "mapped",
            rawHeaders: JSON.stringify(headers),
          },
        });

        for (let i = 0; i < normalized.length; i += INSERT_BATCH_SIZE) {
          await tx.budgetRow.createMany({
            data: normalized.slice(i, i + INSERT_BATCH_SIZE).map((row) => ({
              townId,
              uploadId: upload.id,
              dataCategory,
              ...row,
            })),
          });
        }

        await tx.town.update({
          where: { id: townId },
          data: { published: true },
        });
      },
      { maxWait: 10_000, timeout: 50_000 }
    );
  } catch (e) {
    console.error("Saving budget rows failed; nothing was changed.", e);
    return NextResponse.json(
      {
        error:
          "Saving failed, so nothing was changed. Your existing data is still in place. Please try again.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    rowsCreated: normalized.length,
    townSlug: town.slug,
  });
}
