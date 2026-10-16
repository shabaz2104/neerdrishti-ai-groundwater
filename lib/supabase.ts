"use client";

import { createClient } from "@/lib/supabase/client";

export { createClient } from "@/lib/supabase/client";

/** Backwards-compatible browser client export with cookie-backed auth. */
export const supabase = createClient();
