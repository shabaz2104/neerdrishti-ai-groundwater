import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

function getPublicConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase server configuration is unavailable.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

/** Create a request-scoped server client backed by the current auth cookies. */
export const createClient = cache(async (): Promise<SupabaseClient> => {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getPublicConfig();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. Proxy handles refresh writes.
        }
      },
    },
  });
});
