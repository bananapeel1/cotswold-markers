"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();

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
        setError("Account created, but you are not authorized as an admin.");
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      if (message.includes("email-already-in-use")) {
        setError("An account with this email already exists.");
      } else if (message.includes("weak-password")) {
        setError("Password must be at least 6 characters.");
      } else if (message.includes("invalid-email")) {
        setError("Please enter a valid email address.");
      } else {
        setError(message);
      }
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
            Create Account
          </h1>
          <p className="text-sm text-secondary mt-2">
            Sign up for admin access.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
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
            placeholder="Password (min 6 characters)"
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
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-sm text-secondary text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Sign in
          </Link>
        </p>

        <p className="text-[10px] text-secondary/50 text-center mt-8">
          Protected access for trail administrators only.
        </p>
      </div>
    </div>
  );
}
