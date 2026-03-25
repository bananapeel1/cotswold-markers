"use client";

import { useState } from "react";
import Link from "next/link";

export default function MenuDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="p-2 hover:bg-surface-container rounded-full active:scale-90 transition-all"
        aria-label="Open menu"
      >
        <span className="material-symbols-outlined text-primary">menu</span>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-on-surface/40 z-[60] animate-fade-in"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-surface z-[70] shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <span className="text-xl font-black text-primary tracking-tighter font-headline">
              TrailTap
            </span>
            <button
              onClick={() => setOpen(false)}
              className="p-2 hover:bg-surface-container rounded-full active:scale-90 transition-all"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-secondary">close</span>
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary px-4 pt-4 pb-2">
              Explore
            </p>
            {[
              { icon: "home", label: "Home", href: "/" },
              { icon: "map", label: "Trail Map", href: "/trail" },
              { icon: "qr_code_scanner", label: "Try a Marker", href: "/m/CW01" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-4 px-4 py-3.5 rounded-full text-on-surface hover:bg-surface-container transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-primary">
                  {item.icon}
                </span>
                <span className="font-headline font-bold">{item.label}</span>
              </Link>
            ))}

            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary px-4 pt-8 pb-2">
              Business
            </p>
            {[
              { icon: "handshake", label: "Partner With Us", href: "/sponsors" },
              { icon: "dashboard", label: "Admin Dashboard", href: "/admin" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-4 px-4 py-3.5 rounded-full text-on-surface hover:bg-surface-container transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-secondary">
                  {item.icon}
                </span>
                <span className="font-headline font-bold text-secondary">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-outline-variant/10">
            <p className="text-[10px] text-secondary/60 text-center">
              Built for the modern pathfinder.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
