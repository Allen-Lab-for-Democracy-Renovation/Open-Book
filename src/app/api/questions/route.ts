import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const townId = searchParams.get("townId");

  if (!townId) {
    return NextResponse.json(
      { error: "townId query parameter is required" },
      { status: 400 }
    );
  }

  const questions = await prisma.residentQuestion.findMany({
    where: { townId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(questions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { townId, name, email, message } = body;

  // Validate inputs
  const errors: string[] = [];

  if (!townId) {
    errors.push("townId is required");
  }

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push("Name is required");
  }

  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("A valid email address is required");
  }

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    errors.push("Message is required");
  }

  if (message && typeof message === "string" && message.length > 2000) {
    errors.push("Message must be under 2000 characters");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  // Verify town exists
  const town = await prisma.town.findUnique({ where: { id: townId } });
  if (!town) {
    return NextResponse.json({ error: "Town not found" }, { status: 404 });
  }

  const question = await prisma.residentQuestion.create({
    data: {
      townId,
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    },
  });

  return NextResponse.json(question, { status: 201 });
}
