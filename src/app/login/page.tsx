"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase-client";

const googleProvider = new GoogleAuthProvider();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function createSession(idToken: string) {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (res.ok) {
      window.location.href = "/admin";
      return;
    }

    const data = await res.json();
    if (res.status === 403) {
      setError("You are not authorized as an admin.");
    } else {
      setError(data.error || "Authentication failed");
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      await createSession(idToken);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Google sign-in failed";
      if (!message.includes("popup-closed")) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();
      await createSession(idToken);
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Image
            src="/images/logo.png"
            alt="TrailTap"
            width={48}
            height={48}
            className="mx-auto mb-4"
          />
          <h1 className="font-headline text-2xl font-extrabold text-primary">
            Admin Access
          </h1>
          <p className="text-sm text-secondary mt-2">
            Sign in to manage TrailTap markers.
          </p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-surface-container text-on-surface py-4 rounded-full font-bold text-sm disabled:opacity-50 active:scale-95 transition-all mb-4"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-outline/20" />
          <span className="text-xs text-secondary">or</span>
          <div className="flex-1 h-px bg-outline/20" />
        </div>

        <form onSubmit={handleEmailPassword} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoFocus
            className="w-full px-5 py-4 rounded-md bg-surface-container border-none text-on-surface font-medium placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-5 py-4 rounded-md bg-surface-container border-none text-on-surface font-medium placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          {error && (
            <p className="text-error text-sm font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-secondary text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary font-bold hover:underline">
            Sign up
          </Link>
        </p>

        <p className="text-[10px] text-secondary/50 text-center mt-8">
          Protected access for trail administrators only.
        </p>
      </div>
    </div>
  );
}
