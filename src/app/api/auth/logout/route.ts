import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("openbook_session")?.value;

  if (token) {
    await deleteSession(token);
  }

  cookieStore.delete("openbook_session");

  return NextResponse.json({ success: true });
}
