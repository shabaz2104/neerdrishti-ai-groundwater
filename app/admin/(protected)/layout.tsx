import { redirect } from "next/navigation";

import { getAdminAccess } from "@/lib/admin-auth.server";

import AdminShell from "../admin-shell";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    redirect(access.status === "unauthenticated" ? "/admin/login" : "/admin/login?error=unauthorized");
  }
  return <AdminShell userEmail={access.user.email}>{children}</AdminShell>;
}
