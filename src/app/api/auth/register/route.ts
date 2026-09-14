import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie, getCurrentUser } from "@/lib/auth";
import { sendVerificationEmail, emailEnabled } from "@/lib/email";

// Lets the register page find out, before showing a form, whether a new
// admin can be created right now: always for the very first account, and
// otherwise only while an existing admin is signed in.
export async function GET() {
  const adminCount = await prisma.adminUser.count();
  if (adminCount === 0) {
    return NextResponse.json({ open: true, firstAdmin: true });
  }
  const currentUser = await getCurrentUser();
  return NextResponse.json({ open: Boolean(currentUser), firstAdmin: false });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, name } = body;

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  const adminCount = await prisma.adminUser.count();

  if (adminCount > 0) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Registration is closed. An existing admin must create new accounts." },
        { status: 403 }
      );
    }
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const verificationToken = randomUUID();

  const user = await prisma.adminUser.create({
    data: {
      email,
      passwordHash: hashPassword(password),
      name,
      verificationToken,
    },
  });

  if (adminCount === 0) {
    const token = await createSession(user.id);
    await setSessionCookie(token);
  }

  await sendVerificationEmail(email, name, verificationToken);

  return NextResponse.json(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      emailSent: emailEnabled,
    },
    { status: 201 }
  );
}
