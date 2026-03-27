"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

export default function SignUpNudge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setShow(false);
        return;
      }

      // Only show after 2+ scans
      const stored = localStorage.getItem("trailtap-scanned");
      const scanned: string[] = stored ? JSON.parse(stored) : [];
      if (scanned.length < 2) return;

      // Check if dismissed this session
      if (sessionStorage.getItem("trailtap-nudge-dismissed")) return;

      setShow(true);
    });
    return unsub;
  }, []);

  if (!show) return null;

  return (
    <section className="mx-4">
      <div className="bg-surface-container-low rounded-md p-5 border border-outline-variant/20">
        <div className="flex items-start gap-3">
          <span
            className="material-symbols-outlined text-primary text-xl mt-0.5"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            cloud_sync
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface mb-1">
              Sync your progress
            </p>
            <p className="text-xs text-secondary leading-relaxed mb-3">
              Your scans are saved on this device only. Sign up free to sync across devices, earn badges, and keep a trail journal.
            </p>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded-full active:scale-95 transition-transform"
              >
                Sign Up Free
              </Link>
              <button
                onClick={() => {
                  sessionStorage.setItem("trailtap-nudge-dismissed", "1");
                  setShow(false);
                }}
                className="text-xs text-secondary px-3 py-2"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
