import { redirect } from "next/navigation";

// `/admin` on its own is what people type from memory; send them to the
// dashboard. The proxy has already bounced anyone without a session to
// /admin/login before this runs.
export default function AdminIndexPage() {
  redirect("/admin/setup");
}
