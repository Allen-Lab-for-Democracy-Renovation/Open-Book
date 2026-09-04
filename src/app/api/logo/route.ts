import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

// Logos are stored inline on the Town record as a data URL rather than
// written to disk. Hosts like Vercel have a read-only filesystem outside
// /tmp, and anything written at runtime is discarded on the next deploy,
// so writing to public/uploads failed in production even though it worked
// locally. The admin form downscales images before upload, so the stored
// payload stays small.
const MAX_SIZE = 1024 * 1024; // 1MB

// Raster formats only — SVG is excluded because it can carry active
// content (scripts) and would be rendered same-origin.
const SIGNATURES = [
  {
    ext: "png",
    mimeType: "image/png",
    matches: (b: Uint8Array) =>
      b.length >= 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  {
    ext: "jpg",
    mimeType: "image/jpeg",
    matches: (b: Uint8Array) =>
      b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: "webp",
    mimeType: "image/webp",
    matches: (b: Uint8Array) =>
      b.length >= 12 &&
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
] as const;

function detectMimeType(bytes: Uint8Array): string | null {
  return SIGNATURES.find((sig) => sig.matches(bytes))?.mimeType ?? null;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Logo must be under 1 MB. Try a smaller image." },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const mimeType = detectMimeType(bytes);
    if (!mimeType) {
      return NextResponse.json(
        { error: "Logo must be a PNG, JPEG, or WebP image" },
        { status: 400 }
      );
    }

    const base64 = Buffer.from(bytes).toString("base64");
    return NextResponse.json({ url: `data:${mimeType};base64,${base64}` });
  } catch {
    return NextResponse.json(
      { error: "Could not process that image. Please try another file." },
      { status: 500 }
    );
  }
}
