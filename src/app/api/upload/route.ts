import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseUploadedFile } from "@/lib/parser";
import { decodeDataFile, DataFileTooLargeError } from "@/lib/data-file-transfer";
import { detectColumns } from "@/lib/column-detector";
import type { DataCategory } from "@/types";
import { requireAdmin } from "@/lib/auth";
import {
  MAX_DATA_FILE_SIZE,
  MAX_DATA_FILE_SIZE_LABEL,
} from "@/lib/upload-limits";

interface ValidationError {
  field: string;
  message: string;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const formData = await request.formData();
  const sentFile = formData.get("file") as File | null;
  const townId = formData.get("townId") as string;
  const dataCategory = formData.get("dataCategory") as DataCategory;

  if (!sentFile || !townId || !dataCategory) {
    return NextResponse.json(
      { error: "File, townId, and dataCategory are required" },
      { status: 400 }
    );
  }

  let file: File;
  try {
    file = await decodeDataFile(sentFile, formData.get("encoding"));
  } catch (e) {
    return NextResponse.json(
      {
        error: "Validation failed",
        validationErrors: [
          {
            field: "file",
            message:
              e instanceof DataFileTooLargeError
                ? `File is too large. Maximum size is ${MAX_DATA_FILE_SIZE_LABEL}.`
                : "Could not read the uploaded file. Please try again.",
          },
        ],
      },
      { status: 400 }
    );
  }

  // Validation
  const validationErrors: ValidationError[] = [];

  // File size check
  if (file.size > MAX_DATA_FILE_SIZE) {
    validationErrors.push({
      field: "file",
      message: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is ${MAX_DATA_FILE_SIZE_LABEL}.`,
    });
  }

  // File type check
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx")) {
    validationErrors.push({
      field: "file",
      message: "Only CSV (.csv) and Excel (.xlsx) files are supported.",
    });
  }

  // Empty file check
  if (file.size === 0) {
    validationErrors.push({
      field: "file",
      message: "File is empty.",
    });
  }

  if (validationErrors.length > 0) {
    return NextResponse.json(
      { error: "Validation failed", validationErrors },
      { status: 400 }
    );
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
        error: "Failed to parse file",
        validationErrors: [
          {
            field: "file",
            message: e instanceof Error ? e.message : "Could not read file contents. Check the format.",
          },
        ],
      },
      { status: 400 }
    );
  }

  // Post-parse validation
  const postErrors: ValidationError[] = [];

  if (headers.length < 2) {
    postErrors.push({
      field: "headers",
      message: `File has only ${headers.length} column(s). Budget files typically need at least 2 columns.`,
    });
  }

  // Check for duplicate headers
  const dupes = headers.filter((h, i) => headers.indexOf(h) !== i);
  if (dupes.length > 0) {
    postErrors.push({
      field: "headers",
      message: `Duplicate column names found: ${[...new Set(dupes)].join(", ")}. Each column must have a unique name.`,
    });
  }

  if (rows.length === 0) {
    postErrors.push({
      field: "data",
      message: "File has headers but no data rows.",
    });
  }

  if (postErrors.length > 0) {
    return NextResponse.json(
      { error: "File validation failed", validationErrors: postErrors },
      { status: 400 }
    );
  }

  // This is only a preview: nothing is stored until the admin confirms the
  // mapping, so an abandoned preview leaves no record behind on the Data tab.
  const detectedMappings = detectColumns(headers, rows);

  return NextResponse.json({
    headers,
    sampleRows: rows.slice(0, 5),
    detectedMappings,
    totalRows: rows.length,
  });
}
