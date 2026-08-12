import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const townId = searchParams.get("townId");

  if (!townId) {
    return NextResponse.json({ error: "townId is required" }, { status: 400 });
  }

  const faqs = await prisma.faqEntry.findMany({
    where: { townId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(faqs);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await request.json();
  const { townId, question, answer, sortOrder } = body;

  if (!townId || !question?.trim() || !answer?.trim()) {
    return NextResponse.json(
      { error: "townId, question, and answer are required" },
      { status: 400 }
    );
  }

  const faq = await prisma.faqEntry.create({
    data: {
      townId,
      question: question.trim(),
      answer: answer.trim(),
      sortOrder: Number(sortOrder) || 0,
    },
  });

  return NextResponse.json(faq, { status: 201 });
}
