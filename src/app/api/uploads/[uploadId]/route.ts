import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  const { uploadId } = await params;

  const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
  if (!upload) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  const rows = await prisma.budgetRow.findMany({
    where: { uploadId },
    orderBy: [{ functionArea: "asc" }, { department: "asc" }, { lineItem: "asc" }],
  });

  return NextResponse.json({ upload, rows });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  const { uploadId } = await params;

  const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
  if (!upload) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  const rowsBeingDeleted = await prisma.budgetRow.findMany({
    where: { uploadId },
    select: { functionArea: true, department: true, lineItem: true, category1: true, category2: true },
  });

  await prisma.budgetRow.deleteMany({ where: { uploadId } });
  await prisma.upload.delete({ where: { id: uploadId } });

  const remainingRows = await prisma.budgetRow.findMany({
    where: { townId: upload.townId },
    select: { functionArea: true, department: true, lineItem: true, category1: true, category2: true },
  });

  const remainingCategories = new Set<string>();
  const remainingLineItems = new Set<string>();
  for (const r of remainingRows) {
    if (r.functionArea) remainingCategories.add(r.functionArea);
    if (r.category1) remainingCategories.add(r.category1);
    if (r.lineItem) remainingLineItems.add(r.lineItem);
    if (r.category2) remainingLineItems.add(r.category2);
  }

  const deletedCategories = new Set<string>();
  const deletedLineItems = new Set<string>();
  for (const r of rowsBeingDeleted) {
    if (r.functionArea) deletedCategories.add(r.functionArea);
    if (r.category1) deletedCategories.add(r.category1);
    if (r.lineItem) deletedLineItems.add(r.lineItem);
    if (r.category2) deletedLineItems.add(r.category2);
  }

  const orphanedCategoryKeys = [...deletedCategories].filter((k) => !remainingCategories.has(k));
  const orphanedLineItemKeys = [...deletedLineItems].filter((k) => !remainingLineItems.has(k));

  if (orphanedCategoryKeys.length > 0) {
    await prisma.tooltip.deleteMany({
      where: { townId: upload.townId, scope: "category", key: { in: orphanedCategoryKeys } },
    });
  }
  if (orphanedLineItemKeys.length > 0) {
    await prisma.tooltip.deleteMany({
      where: { townId: upload.townId, scope: "line-item", key: { in: orphanedLineItemKeys } },
    });
  }

  const remaining = remainingRows.length;

  if (remaining === 0) {
    await prisma.town.update({
      where: { id: upload.townId },
      data: { published: false },
    });
  }

  return NextResponse.json({ success: true, remainingRows: remaining });
}
