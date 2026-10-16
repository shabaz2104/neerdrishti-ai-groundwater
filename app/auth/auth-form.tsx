"use client";

import { FormEvent, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import PublicBrand from "@/app/public-brand";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "signin" | "signup";
type AuthFormProps = { callbackError?: string; initialMode: AuthMode };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthForm({ callbackError, initialMode }: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | undefined>(callbackError);
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);
  const submitLock = useRef(false);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    const normalizedEmail = email.trim();
    if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) {
      setErrorMessage("Enter a valid email address.");
      return;
    }
    if (password.length === 0 || password.length > 128) {
      setErrorMessage("Enter your password.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setErrorMessage("Password confirmation does not match.");
      return;
    }

    submitLock.current = true;
    setIsPending(true);
    try {
      const supabase = createClient();
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error || !data.session) {
          setErrorMessage("We could not sign you in. Check your email and password.");
          return;
        }
        router.replace("/app");
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setErrorMessage("We could not create your account. Check your details and try again.");
        return;
      }
      if (data.session) {
        router.replace("/app");
        router.refresh();
      } else {
        setSuccessMessage("Account created. Check your email for a confirmation link before signing in.");
        setPassword("");
        setConfirmPassword("");
      }
    } catch {
      setErrorMessage("Authentication is temporarily unavailable. Please try again.");
    } finally {
      submitLock.current = false;
      setIsPending(false);
    }
  }

  const isSignIn = mode === "signin";
  return <main className="auth-site"><div className="auth-layout">
    <section className="auth-landscape" aria-label="NeerDrishti introduction">
      <Image className="auth-landscape-image" src="/images/maharashtra-water-landscape.webp" alt="" fill sizes="(max-width: 768px) 100vw, 50vw" />
      <div className="auth-landscape-shade" aria-hidden="true" />
      <div className="auth-landscape-content"><PublicBrand /><div><p className="public-eyebrow">Maharashtra Groundwater Insights</p><p className="auth-landscape-headline">Groundwater data for people, planning and a more water-secure future.</p><p>Explore Maharashtra’s 2024 groundwater assessments in one clear workspace.</p></div><span>NeerDrishti · 2024 assessment data</span></div>
    </section>
    <section className="auth-form-side" aria-labelledby="auth-title">
      <div className="auth-form-top"><Link href="/" className="auth-back-link">← Back to home</Link><span>{isSignIn ? "New to NeerDrishti?" : "Already have an account?"} <button type="button" onClick={() => switchMode(isSignIn ? "signup" : "signin")}>{isSignIn ? "Create an account" : "Sign in"}</button></span></div>
      <div className="auth-form-wrap"><div className="auth-mobile-brand"><PublicBrand /></div><p className="public-eyebrow">Your groundwater workspace</p><h1 id="auth-title">{isSignIn ? "Welcome back" : "Create your account"}</h1><p className="auth-intro">{isSignIn ? "Sign in to continue exploring Maharashtra’s groundwater data." : "Create an account to explore the 2024 groundwater assessments."}</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field"><label htmlFor="email">Email</label><input autoComplete="email" id="email" maxLength={254} name="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} /></div>
          <div className="auth-field"><label htmlFor="password">Password</label><input autoComplete={isSignIn ? "current-password" : "new-password"} id="password" maxLength={128} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></div>
          {!isSignIn && <div className="auth-field"><label htmlFor="confirm-password">Confirm password</label><input autoComplete="new-password" id="confirm-password" maxLength={128} name="confirm-password" onChange={(event) => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} /></div>}
          {errorMessage && <p className="auth-message auth-message-error" role="alert">{errorMessage}</p>}
          {successMessage && <p className="auth-message auth-message-success" role="status">{successMessage}</p>}
          <button className="public-button auth-submit" disabled={isPending} type="submit">{isPending ? "Please wait…" : isSignIn ? "Sign in" : "Create account"}</button>
        </form>
        <p className="auth-mode-switch">{isSignIn ? "Need an account?" : "Already have an account?"} <button onClick={() => switchMode(isSignIn ? "signup" : "signin")} type="button">{isSignIn ? "Create one" : "Sign in"}</button></p>
      </div>
      <p className="auth-form-footer">NeerDrishti · Maharashtra Groundwater Insights</p>
    </section>
  </div></main>;
}
