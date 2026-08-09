import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { verifyAdminFromCookies } from "@/lib/auth";

// Server-side gate for the whole /admin segment. The proxy only checks that a
// session cookie exists; this verifies the session AND the allowedAdmins list
// so non-admin walkers can't view admin pages. Writes are separately guarded
// by verifyAdmin() in every admin API route.
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await verifyAdminFromCookies();
  if (!admin) {
    redirect("/login?redirect=/admin");
  }

  return <AuthProvider>{children}</AuthProvider>;
}
