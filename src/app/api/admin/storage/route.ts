import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readdirSync, statSync } from "fs";
import { join } from "path";

export async function GET() {
  const [databaseSize] = await prisma.$queryRaw<{ size: bigint }[]>`
    SELECT pg_database_size(current_database())::bigint AS size
  `;
  const dbSize = Number(databaseSize?.size || 0);

  const uploadCount = await prisma.upload.count();
  const rowCount = await prisma.budgetRow.count();
  const pdfCount = await prisma.pdfDocument.count();
  const totalPdfSize = await prisma.pdfDocument.aggregate({ _sum: { fileSize: true } });

  const uploadsDir = join(process.cwd(), "public", "uploads");
  let uploadsDirSize = 0;
  try {
    const files = readdirSync(uploadsDir);
    for (const f of files) {
      try {
        uploadsDirSize += statSync(join(uploadsDir, f)).size;
      } catch {
        continue;
      }
    }
  } catch {
    uploadsDirSize = 0;
  }

  const FREE_TIER_LIMIT = 100 * 1024 * 1024;
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
