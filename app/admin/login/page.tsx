import { redirect } from "next/navigation";

import { getAdminAccess } from "@/lib/admin-auth.server";

import AdminLoginForm from "./admin-login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string | string[] }> }) {
  const [access, params] = await Promise.all([getAdminAccess(), searchParams]);
  if (access.status === "authorized") redirect("/admin");
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorMessage = error === "unauthorized"
    ? "This account is not authorized for NeerDrishti administration."
    : undefined;
  return <AdminLoginForm initialError={errorMessage} />;
}
