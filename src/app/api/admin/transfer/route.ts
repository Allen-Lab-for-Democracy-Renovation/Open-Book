import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { newEmail, newName, newPassword } = body;

  if (!newEmail || !newName || !newPassword) {
    return NextResponse.json(
      { error: "New email, name, and password are required" },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const existing = await prisma.adminUser.findUnique({ where: { email: newEmail } });
  if (existing && existing.id !== currentUser.id) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const newUser = await prisma.adminUser.create({
    data: {
      email: newEmail,
      name: newName,
      passwordHash: hashPassword(newPassword),
    },
  });

  await prisma.session.deleteMany({ where: { userId: currentUser.id } });
  await prisma.adminUser.delete({ where: { id: currentUser.id } });

  return NextResponse.json({
    success: true,
    message: "Account transferred successfully. The new admin should log in.",
    newUserId: newUser.id,
  });
}
