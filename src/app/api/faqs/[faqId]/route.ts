import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ faqId: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { faqId } = await params;
  const body = await request.json();
  const { question, answer, sortOrder } = body;

  if (question !== undefined && !question?.trim()) {
    return NextResponse.json(
      { error: "question cannot be empty" },
      { status: 400 }
    );
  }
  if (answer !== undefined && !answer?.trim()) {
    return NextResponse.json(
      { error: "answer cannot be empty" },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = {};
  if (question !== undefined) data.question = question.trim();
  if (answer !== undefined) data.answer = answer.trim();
  if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

  try {
    const faq = await prisma.faqEntry.update({
      where: { id: faqId },
      data,
    });
    return NextResponse.json(faq);
  } catch {
    return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ faqId: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { faqId } = await params;

  try {
    await prisma.faqEntry.delete({ where: { id: faqId } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
  }
}
