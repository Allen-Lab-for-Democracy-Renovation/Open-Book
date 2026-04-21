import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  createStaffSession,
  setStaffSessionCookie,
} from "@/lib/staff-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.staffUser.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await createStaffSession(user.id);
    await setStaffSessionCookie(token);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      townId: user.townId,
    });
  } catch (error) {
    console.error("Staff login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
