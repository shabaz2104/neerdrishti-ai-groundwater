import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code && code.length <= 4_096 && !/[\u0000-\u001f\u007f]/.test(code)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL("/app", requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/auth?error=confirmation", requestUrl.origin),
  );
}
