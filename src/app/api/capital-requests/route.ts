import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffSessionFromCookie } from "@/lib/staff-auth";
import { getSessionFromCookie } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const adminSession = await getSessionFromCookie();
  const staffSession = await getStaffSessionFromCookie();

  if (!adminSession && !staffSession) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  if (adminSession) {
    // Admins may filter by town and/or staff member.
    const townId = searchParams.get("townId");
    const staffUserId = searchParams.get("staffUserId");
    if (townId) where.townId = townId;
    if (staffUserId) where.staffUserId = staffUserId;
  } else if (staffSession) {
    // Staff can only ever see their own requests, regardless of query params.
    where.staffUserId = staffSession.userId;
  }

  const requests = await prisma.capitalRequest.findMany({
    where,
    include: {
      staffUser: {
        select: { id: true, name: true, email: true, department: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  try {
    const session = await getStaffSessionFromCookie();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const staff = await prisma.staffUser.findUnique({
      where: { id: session.userId },
    });
    if (!staff) {
      return NextResponse.json(
        { error: "Staff user not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { department, purpose, description, amount, fundingSource, justification, fiscalYear } = body;

    if (!department || !purpose || !amount || !fiscalYear || !justification) {
      return NextResponse.json(
        { error: "Department, purpose, amount, fiscal year, and justification are required" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    const capitalRequest = await prisma.capitalRequest.create({
      data: {
        townId: staff.townId,
        staffUserId: staff.id,
        department,
        purpose,
        description: description || null,
        amount,
        fundingSource: fundingSource || null,
        justification: justification || null,
        fiscalYear,
        status: "submitted",
      },
    });

    return NextResponse.json(capitalRequest, { status: 201 });
  } catch (error) {
    console.error("Capital request creation error:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}
