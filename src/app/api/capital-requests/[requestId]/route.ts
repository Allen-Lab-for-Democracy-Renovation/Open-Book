import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffSessionFromCookie } from "@/lib/staff-auth";
import { getSessionFromCookie } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const body = await request.json();

    const capitalRequest = await prisma.capitalRequest.findUnique({
      where: { id: requestId },
    });

    if (!capitalRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Check if this is an admin action (status/adminNotes update)
    const adminSession = await getSessionFromCookie();
    if (adminSession) {
      const { status, adminNotes } = body;
      const updateData: Record<string, unknown> = {};
      if (status) updateData.status = status;
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

      const updated = await prisma.capitalRequest.update({
        where: { id: requestId },
        data: updateData,
      });
      return NextResponse.json(updated);
    }

    // Check if this is a staff action
    const staffSession = await getStaffSessionFromCookie();
    if (!staffSession) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Staff can only edit their own requests that are still "submitted"
    if (capitalRequest.staffUserId !== staffSession.userId) {
      return NextResponse.json(
        { error: "You can only edit your own requests" },
        { status: 403 }
      );
    }

    if (capitalRequest.status !== "submitted") {
      return NextResponse.json(
        { error: "Can only edit requests with status 'submitted'" },
        { status: 403 }
      );
    }

    const { department, purpose, description, amount, fundingSource, justification, fiscalYear } = body;
    const updateData: Record<string, unknown> = {};
    if (department !== undefined) updateData.department = department;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = amount;
    if (fundingSource !== undefined) updateData.fundingSource = fundingSource;
    if (justification !== undefined) updateData.justification = justification;
    if (fiscalYear !== undefined) updateData.fiscalYear = fiscalYear;

    const updated = await prisma.capitalRequest.update({
      where: { id: requestId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Capital request update error:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;

    const staffSession = await getStaffSessionFromCookie();
    if (!staffSession) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const capitalRequest = await prisma.capitalRequest.findUnique({
      where: { id: requestId },
    });

    if (!capitalRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (capitalRequest.staffUserId !== staffSession.userId) {
      return NextResponse.json(
        { error: "You can only delete your own requests" },
        { status: 403 }
      );
    }

    if (capitalRequest.status !== "submitted") {
      return NextResponse.json(
        { error: "Can only delete requests with status 'submitted'" },
        { status: 403 }
      );
    }

    await prisma.capitalRequest.delete({ where: { id: requestId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Capital request delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete request" },
      { status: 500 }
    );
  }
}
