import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ townId: string }> }
) {
  const { townId } = await params;

  const rows = await prisma.budgetRow.findMany({
    where: { townId },
    select: {
      functionArea: true,
      category1: true,
      lineItem: true,
    },
  });

  // Collect unique categories (function areas + category1 values)
  const categorySet = new Set<string>();
  const lineItemSet = new Set<string>();

  for (const row of rows) {
    if (row.functionArea) categorySet.add(row.functionArea);
    if (row.category1) categorySet.add(row.category1);
    if (row.lineItem) lineItemSet.add(row.lineItem);
  }

  return NextResponse.json({
    categories: [...categorySet].sort(),
    lineItems: [...lineItemSet].sort(),
  });
}
