import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "openbook_staff_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const hashBuffer = Buffer.from(hash, "hex");
  const derivedBuffer = scryptSync(password, salt, 64);
  return timingSafeEqual(hashBuffer, derivedBuffer);
}

export async function createStaffSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.staffSession.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000),
    },
  });
  return token;
}

export async function getStaffSession(token: string): Promise<{ userId: string } | null> {
  const session = await prisma.staffSession.findUnique({ where: { token } });
  if (!session) return null;
  if (new Date() > session.expiresAt) {
    await prisma.staffSession.delete({ where: { token } });
    return null;
  }
  return { userId: session.userId };
}

export async function deleteStaffSession(token: string): Promise<void> {
  await prisma.staffSession.delete({ where: { token } }).catch(() => {});
}

export async function setStaffSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearStaffSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getStaffSessionFromCookie(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getStaffSession(token);
}

export async function getCurrentStaff() {
  const session = await getStaffSessionFromCookie();
  if (!session) return null;
  const user = await prisma.staffUser.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      department: true,
      townId: true,
      town: {
        select: { id: true, name: true, slug: true, primaryColor: true },
      },
    },
  });
  return user;
}
