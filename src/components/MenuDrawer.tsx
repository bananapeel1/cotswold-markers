"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Global menu state via custom events
export function useMenuOpen() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    window.addEventListener("trailtap:menu-open", handleOpen);
    window.addEventListener("trailtap:menu-close", handleClose);
    return () => {
      window.removeEventListener("trailtap:menu-open", handleOpen);
      window.removeEventListener("trailtap:menu-close", handleClose);
    };
  }, []);

  return open;
}

export function openMenu() {
  window.dispatchEvent(new Event("trailtap:menu-open"));
}

export function closeMenu() {
  window.dispatchEvent(new Event("trailtap:menu-close"));
}

/** Button to trigger menu — place inside header */
export function MenuButton({ transparent = false }: { transparent?: boolean }) {
  return (
    <button
      onClick={() => openMenu()}
      className="p-2 hover:bg-surface-container rounded-full active:scale-90 transition-all"
      aria-label="Open menu"
    >
      <span className={`material-symbols-outlined ${transparent ? "text-white" : "text-primary"}`}>menu</span>
    </button>
  );
}

/** Drawer panel — place OUTSIDE header (e.g. in layout.tsx) */
export default function MenuDrawer() {
  const open = useMenuOpen();

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={() => closeMenu()}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(28, 28, 24, 0.4)",
            zIndex: 9998,
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fcf9f2",
          height: "100dvh",
          width: "320px",
          maxWidth: "85vw",
          boxShadow: open ? "-10px 0 40px rgba(0, 0, 0, 0.15)" : "none",
          transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          transform: open ? "translateX(0%)" : "translateX(100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem", paddingBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src="/images/logo.png" alt="TrailTap" width={28} height={28} />
            <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#154212", letterSpacing: "-0.05em", fontFamily: "var(--font-manrope, Manrope, sans-serif)" }}>
              TrailTap
            </span>
          </div>
          <button
            onClick={() => closeMenu()}
            style={{ padding: "0.5rem", borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer" }}
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined" style={{ color: "#5e5e5e" }}>close</span>
          </button>
        </div>

        <nav style={{ flex: 1, padding: "0 1rem", overflowY: "auto" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#5e5e5e", padding: "1rem 1rem 0.5rem" }}>
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
              onClick={() => closeMenu()}
              style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1rem", borderRadius: "9999px", color: "#1c1c18", textDecoration: "none", fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontWeight: 700 }}
            >
              <span className="material-symbols-outlined" style={{ color: "#154212" }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#5e5e5e", padding: "2rem 1rem 0.5rem" }}>
            My Progress
          </p>
          <Link
            href="/my-trail"
            onClick={() => closeMenu()}
            style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1rem", borderRadius: "9999px", color: "#1c1c18", textDecoration: "none", fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontWeight: 700 }}
          >
            <span className="material-symbols-outlined" style={{ color: "#154212" }}>person</span>
            My Trail
          </Link>

          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#5e5e5e", padding: "2rem 1rem 0.5rem" }}>
            More
          </p>
          <Link
            href="/sponsors"
            onClick={() => closeMenu()}
            style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1rem", borderRadius: "9999px", color: "#5e5e5e", textDecoration: "none", fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontWeight: 700 }}
          >
            <span className="material-symbols-outlined" style={{ color: "#5e5e5e" }}>handshake</span>
            Partner With Us
          </Link>
          <a
            href="https://cotswoldwayassociation.org.uk/fundraising/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => closeMenu()}
            style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1rem", borderRadius: "9999px", color: "#5e5e5e", textDecoration: "none", fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontWeight: 700 }}
          >
            <span className="material-symbols-outlined" style={{ color: "#e67e22" }}>volunteer_activism</span>
            Support the Trail
          </a>
        </nav>

        <div style={{ padding: "1.5rem", borderTop: "1px solid rgba(0,0,0,0.05)", textAlign: "center" }}>
          <p style={{ fontSize: "10px", color: "rgba(94,94,94,0.6)" }}>Every marker tells a story. Every step finds a stop.</p>
        </div>
      </div>
    </>
  );
}
