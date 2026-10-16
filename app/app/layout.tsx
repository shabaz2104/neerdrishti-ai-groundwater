import { redirect } from "next/navigation";

import AppShell from "@/app/app/app-shell";
import { getCurrentUser } from "@/lib/auth.server";
import "./protected-visual.css";

export const dynamic = "force-dynamic";

export default async function AuthenticatedAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  return <AppShell userEmail={user.email}>{children}</AppShell>;
}
