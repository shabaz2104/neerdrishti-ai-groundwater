"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const submitLock = useRef(false);

  async function handleSignOut() {
    if (submitLock.current) return;
    submitLock.current = true;
    setIsPending(true);
    setErrorMessage(undefined);

    try {
      const { error } = await createClient().auth.signOut();
      if (error) {
        setErrorMessage("We could not sign you out. Please try again.");
        return;
      }

      router.replace("/auth");
      router.refresh();
    } catch {
      setErrorMessage("We could not sign you out. Please try again.");
    } finally {
      submitLock.current = false;
      setIsPending(false);
    }
  }

  return (
    <div>
      <button
        className="app-sign-out disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        onClick={handleSignOut}
        type="button"
      >
        {isPending ? "Signing out…" : "Sign out"}
      </button>
      {errorMessage && (
        <p className="mt-3 text-sm text-rose-700" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
