import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/lib/staff-auth";

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    id: staff.id,
    email: staff.email,
    name: staff.name,
    department: staff.department,
    townId: staff.townId,
    town: staff.town,
  });
}
