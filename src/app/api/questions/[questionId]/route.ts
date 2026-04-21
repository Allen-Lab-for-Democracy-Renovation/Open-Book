import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { questionId } = await params;
  const body = await request.json();
  const { status, reply } = body;

  const question = await prisma.residentQuestion.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  // Validate status if provided
  if (status && !["new", "read", "replied"].includes(status)) {
    return NextResponse.json(
      { error: "Status must be one of: new, read, replied" },
      { status: 400 }
    );
  }

  const updated = await prisma.residentQuestion.update({
    where: { id: questionId },
    data: {
      ...(status !== undefined && { status }),
      ...(reply !== undefined && { reply: reply || null }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { questionId } = await params;

  const question = await prisma.residentQuestion.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  await prisma.residentQuestion.delete({
    where: { id: questionId },
  });

  return NextResponse.json({ success: true });
}
