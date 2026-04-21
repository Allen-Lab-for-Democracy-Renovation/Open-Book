import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteStaffSession, clearStaffSessionCookie } from "@/lib/staff-auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("openbook_staff_session")?.value;

    if (token) {
      await deleteStaffSession(token);
    }

    await clearStaffSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Staff logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
