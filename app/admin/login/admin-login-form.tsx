"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DashboardIcon from "@/app/app/dashboard-icons";
import PublicBrand from "@/app/public-brand";
import ThemeToggle from "@/app/theme-toggle";
import { createClient } from "@/lib/supabase/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminLoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [pending, setPending] = useState(false);
  const submitLock = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    setErrorMessage(undefined);
    const normalizedEmail = email.trim();
    if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254 || password.length === 0 || password.length > 128) {
      setErrorMessage("Enter a valid email address and password.");
      return;
    }
    submitLock.current = true;
    setPending(true);
    try {
      const { data, error } = await createClient().auth.signInWithPassword({ email: normalizedEmail, password });
      if (error || !data.session) {
        setErrorMessage("We could not sign you in. Check your email and password.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setErrorMessage("Authentication is temporarily unavailable. Please try again.");
    } finally {
      submitLock.current = false;
      setPending(false);
    }
  }

  return <main className="admin-login"><section className="admin-login-panel">
    <div className="admin-login-brand"><PublicBrand /><ThemeToggle /></div>
    <div className="admin-login-heading"><span className="admin-badge"><DashboardIcon name="user" /> Restricted administration</span><p>NeerDrishti Administration</p><h1>Admin access</h1><span>Sign in with an authorized administrator account.</span></div>
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <label>Email<input autoComplete="email" maxLength={254} onChange={(event) => setEmail(event.target.value)} placeholder="administrator@example.com" required type="email" value={email} /></label>
      <label>Password<input autoComplete="current-password" maxLength={128} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
      {errorMessage && <p className="admin-message is-error" role="alert">{errorMessage}</p>}
      <button className="admin-primary-button" disabled={pending} type="submit">{pending ? "Signing in…" : "Sign in"}</button>
    </form>
    <div className="admin-login-foot"><Link href="/">← Back to NeerDrishti</Link><span>Existing Supabase account required</span></div>
  </section><aside className="admin-login-context" aria-label="Administration notice"><div><p>Trusted data maintenance</p><h2>Controlled corrections, with source provenance preserved.</h2><span>Administrative changes affect the database only. The verified source files remain unchanged.</span></div></aside></main>;
}
