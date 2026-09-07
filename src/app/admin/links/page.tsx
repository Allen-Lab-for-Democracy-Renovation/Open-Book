import { redirect } from "next/navigation";

// Links and PDFs are managed together now, mirroring the single Documents &
// Resources page residents see. Kept so existing bookmarks still land somewhere
// useful.
export default function AdminLinksPage() {
  redirect("/admin/documents");
}
