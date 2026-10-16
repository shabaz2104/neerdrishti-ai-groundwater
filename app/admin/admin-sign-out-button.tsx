"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function AdminSignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const submitLock = useRef(false);
  async function signOut() {
    if (submitLock.current) return;
    submitLock.current = true;
    setPending(true);
    setErrorMessage(undefined);
    try {
      const { error } = await createClient().auth.signOut();
      if (!error) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }
      setErrorMessage("Sign out failed. Please try again.");
    } catch {
      setErrorMessage("Sign out failed. Please try again.");
    } finally {
      submitLock.current = false;
      setPending(false);
    }
  }
  return <div className="admin-sign-out"><button disabled={pending} onClick={signOut} type="button">{pending ? "Signing out…" : "Sign out"}</button>{errorMessage && <span role="alert">{errorMessage}</span>}</div>;
}
