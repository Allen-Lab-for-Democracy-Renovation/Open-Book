"use client";

import { useRouter } from "next/navigation";

export default function StaffLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/staff/auth/logout", { method: "POST" });
    router.push("/staff/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="text-white/60 hover:text-white text-sm"
      aria-label="Sign out"
    >
      Sign Out
    </button>
  );
}
