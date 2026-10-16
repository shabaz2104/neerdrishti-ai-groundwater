import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserResult } from "@/lib/auth.server";

export type AdminAccessStatus = "authorized" | "forbidden" | "unauthenticated";

export type AdminContext = {
  supabase: SupabaseClient;
  user: User;
};

export class AdminAuthorizationError extends Error {
  constructor(public readonly status: Exclude<AdminAccessStatus, "authorized">) {
    super(status === "unauthenticated" ? "Authentication required." : "Admin access required.");
    this.name = "AdminAuthorizationError";
  }
}

export const getAdminAccess = cache(async (): Promise<
  | ({ status: "authorized" } & AdminContext)
  | { status: "forbidden" | "unauthenticated"; user?: User }
> => {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await getCurrentUserResult();

  if (userError || !user) {
    return { status: "unauthenticated" };
  }

  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError || !role) {
    return { status: "forbidden", user };
  }

  return { status: "authorized", supabase, user };
});

export async function isAdmin(userId: string): Promise<boolean> {
  const access = await getAdminAccess();
  return access.status === "authorized" && access.user.id === userId;
}

export async function requireAdmin(): Promise<AdminContext> {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    throw new AdminAuthorizationError(access.status);
  }
  return { supabase: access.supabase, user: access.user };
}
