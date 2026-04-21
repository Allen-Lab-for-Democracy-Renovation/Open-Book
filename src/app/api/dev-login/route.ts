import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";
import {
  hashPassword as hashStaffPassword,
  createStaffSession,
  setStaffSessionCookie,
} from "@/lib/staff-auth";

const DEV_ADMIN = {
  email: "dev-admin@openbook.test",
  name: "Dev Admin",
  password: "devdevdev",
};

const DEV_STAFF = {
  email: "dev-staff@openbook.test",
  name: "Dev Staff",
  password: "devdevdev",
  department: "Public Works",
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { role } = await request.json();

  if (role === "admin") {
    let user = await prisma.adminUser.findUnique({
      where: { email: DEV_ADMIN.email },
    });
    if (!user) {
      user = await prisma.adminUser.create({
        data: {
          email: DEV_ADMIN.email,
          name: DEV_ADMIN.name,
          passwordHash: hashPassword(DEV_ADMIN.password),
        },
      });
    }
    const token = await createSession(user.id);
    await setSessionCookie(token);
    return NextResponse.json({ ok: true, role: "admin", redirect: "/admin/setup" });
  }

  if (role === "staff") {
    const town = await prisma.town.findFirst();
    if (!town) {
      return NextResponse.json(
        { error: "No town exists yet. Create one via admin setup first." },
        { status: 400 }
      );
    }

    let user = await prisma.staffUser.findUnique({
      where: { email: DEV_STAFF.email },
    });
    if (!user) {
      user = await prisma.staffUser.create({
        data: {
          email: DEV_STAFF.email,
          name: DEV_STAFF.name,
          passwordHash: hashStaffPassword(DEV_STAFF.password),
          department: DEV_STAFF.department,
          townId: town.id,
        },
      });
    }
    const token = await createStaffSession(user.id);
    await setStaffSessionCookie(token);
    return NextResponse.json({ ok: true, role: "staff", redirect: "/staff" });
  }

  return NextResponse.json({ error: "Invalid role. Use 'admin' or 'staff'." }, { status: 400 });
}
