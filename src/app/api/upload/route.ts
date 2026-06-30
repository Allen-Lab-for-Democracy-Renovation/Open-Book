import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseCSV, parseExcel, cleanRows } from "@/lib/parser";
import { detectColumns } from "@/lib/column-detector";
import type { DataCategory } from "@/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ValidationError {
  field: string;
  message: string;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const townId = formData.get("townId") as string;
  const dataCategory = formData.get("dataCategory") as DataCategory;

  if (!file || !townId || !dataCategory) {
    return NextResponse.json(
      { error: "File, townId, and dataCategory are required" },
      { status: 400 }
    );
  }

  // Validation
  const validationErrors: ValidationError[] = [];

  // File size check
  if (file.size > MAX_FILE_SIZE) {
    validationErrors.push({
      field: "file",
      message: `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`,
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

  const fileType = fileName.endsWith(".xlsx") ? "xlsx" : "csv";

  let headers: string[];
  let rows: Record<string, string>[];

  try {
    if (fileType === "csv") {
      const text = await file.text();
      const parsed = cleanRows(parseCSV(text));
      headers = parsed.headers;
      rows = parsed.rows;
    } else {
      const buffer = await file.arrayBuffer();
      const parsed = cleanRows(parseExcel(buffer));
      headers = parsed.headers;
      rows = parsed.rows;
    }
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

  // Create upload record
  const upload = await prisma.upload.create({
    data: {
      townId,
      fileName: file.name,
      fileType,
      dataCategory,
      rowCount: rows.length,
      status: "uploaded",
      rawHeaders: JSON.stringify(headers),
    },
  });

  // Auto-detect column mappings
  const detectedMappings = detectColumns(headers);

  return NextResponse.json({
    uploadId: upload.id,
    headers,
    sampleRows: rows.slice(0, 5),
    detectedMappings,
    totalRows: rows.length,
  });
}
