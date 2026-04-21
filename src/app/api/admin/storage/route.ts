import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { statSync } from "fs";
import { join } from "path";

export async function GET() {
  const dbPath = join(process.cwd(), "dev.db");
  let dbSize = 0;
  try {
    dbSize = statSync(dbPath).size;
  } catch {
    // DB file might not exist
  }

  const uploadCount = await prisma.upload.count();
  const rowCount = await prisma.budgetRow.count();
  const pdfCount = await prisma.pdfDocument.count();
  const totalPdfSize = await prisma.pdfDocument.aggregate({ _sum: { fileSize: true } });

  const uploadsDir = join(process.cwd(), "public", "uploads");
  let uploadsDirSize = 0;
  try {
    const { readdirSync, statSync: statS } = require("fs");
    const files = readdirSync(uploadsDir);
    for (const f of files) {
      try {
        uploadsDirSize += statS(join(uploadsDir, f)).size;
      } catch {
        // skip unreadable files
      }
    }
  } catch {
    // dir might not exist
  }

  const FREE_TIER_LIMIT = 100 * 1024 * 1024; // 100MB
  const totalUsed = dbSize + uploadsDirSize;

  return NextResponse.json({
    database: {
      sizeBytes: dbSize,
      uploads: uploadCount,
      budgetRows: rowCount,
      pdfDocuments: pdfCount,
    },
    files: {
      sizeBytes: uploadsDirSize,
      pdfSizeBytes: totalPdfSize._sum.fileSize || 0,
    },
    total: {
      sizeBytes: totalUsed,
      limitBytes: FREE_TIER_LIMIT,
      percentUsed: Math.round((totalUsed / FREE_TIER_LIMIT) * 100),
    },
  });
}
