import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

function getPublicConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase browser configuration is unavailable.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

/** Return the browser client that persists the Supabase session in cookies. */
export function createClient(): SupabaseClient {
  if (!browserClient) {
    const { supabaseUrl, supabaseAnonKey } = getPublicConfig();
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}
