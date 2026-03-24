"use client";

import Link from "next/link";

type NavItem = "home" | "explore" | "scan" | "profile";

export default function BottomNav({ active = "home" }: { active?: NavItem }) {
  const items: { id: NavItem; icon: string; label: string; href: string }[] = [
    { id: "home", icon: "home", label: "Home", href: "/" },
    { id: "explore", icon: "explore", label: "Explore", href: "/trail" },
    { id: "scan", icon: "qr_code_scanner", label: "Scan", href: "/m/CW01" },
    { id: "profile", icon: "person", label: "Profile", href: "/admin" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-surface/90 backdrop-blur-xl rounded-t-[2rem] border-t border-outline-variant/10 shadow-[0px_-12px_32px_rgba(28,28,24,0.06)]">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`flex flex-col items-center justify-center active:scale-90 transition-all duration-300 ${
              isActive
                ? "text-primary bg-surface-container rounded-full px-4 py-2"
                : "text-secondary opacity-70 hover:opacity-100"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="font-label text-[10px] font-bold uppercase tracking-widest mt-1">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
