import { redirect } from "next/navigation";

import AuthForm from "@/app/auth/auth-form";
import { getCurrentUser } from "@/lib/auth.server";

export const dynamic = "force-dynamic";

type AuthPageProps = {
  searchParams: Promise<{ error?: string | string[]; mode?: string | string[] }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  if (await getCurrentUser()) {
    redirect("/app");
  }

  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const callbackError =
    error === "confirmation"
      ? "That email confirmation link could not be completed. Please try signing in again."
      : undefined;

  return <AuthForm callbackError={callbackError} initialMode={mode === "signup" ? "signup" : "signin"} />;
}
