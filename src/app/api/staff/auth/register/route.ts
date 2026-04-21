import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  createStaffSession,
  setStaffSessionCookie,
} from "@/lib/staff-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, department, townSlug } = body;

    if (!email || !password || !name || !townSlug) {
      return NextResponse.json(
        { error: "Email, password, name, and town slug are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Look up town by slug
    const town = await prisma.town.findUnique({ where: { slug: townSlug } });
    if (!town) {
      return NextResponse.json(
        { error: "Town not found" },
        { status: 404 }
      );
    }

    // Check if email is already registered
    const existing = await prisma.staffUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Create staff user
    const passwordHash = hashPassword(password);
    const user = await prisma.staffUser.create({
      data: {
        email,
        passwordHash,
        name,
        department: department || null,
        townId: town.id,
      },
    });

    // Create session and set cookie
    const token = await createStaffSession(user.id);
    await setStaffSessionCookie(token);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      townId: user.townId,
    });
  } catch (error) {
    console.error("Staff registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
