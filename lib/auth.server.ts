import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** React cache lasts one server render, never across users or requests. */
export const getCurrentUserResult = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getUser();
});

/** Verify the current request's Supabase user on the server. */
export async function getCurrentUser() {
  const {
    data: { user },
  } = await getCurrentUserResult();

  return user;
}
