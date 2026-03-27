import Link from "next/link";
import Image from "next/image";
import { MenuButton } from "./MenuDrawer";

export default function TopNav({ transparent = false }: { transparent?: boolean }) {
  return (
    <header
      className={`fixed top-0 w-full z-50 h-16 px-6 transition-colors ${
        transparent
          ? "bg-transparent"
          : "bg-surface/90 backdrop-blur-md"
      }`}
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        {/* Left: logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo.png"
            alt="TrailTap"
            width={32}
            height={32}
            className={`w-8 h-8 ${transparent ? "brightness-0 invert" : ""}`}
          />
          <span
            className={`text-xl font-black tracking-tighter font-headline ${
              transparent ? "text-white" : "text-primary"
            }`}
          >
            TrailTap
          </span>
        </Link>

        {/* Center: desktop nav links */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <Link
            href="/"
            className={`font-bold font-headline hover:opacity-80 transition-opacity ${
              transparent ? "text-white" : "text-primary"
            }`}
          >
            Home
          </Link>
          <Link
            href="/trail"
            className={`font-bold font-headline transition-colors ${
              transparent
                ? "text-white/70 hover:text-white"
                : "text-secondary hover:text-primary"
            }`}
          >
            Explore
          </Link>
          <Link
            href="/sponsors"
            className={`font-bold font-headline transition-colors ${
              transparent
                ? "text-white/70 hover:text-white"
                : "text-secondary hover:text-primary"
            }`}
          >
            Partners
          </Link>
        </nav>

        {/* Right: map icon (desktop) + hamburger (mobile only) */}
        <div className="flex items-center gap-2">
          <Link
            href="/trail"
            className="hidden md:flex active:scale-95 transition-transform p-2 hover:bg-surface-container/50 rounded-full"
          >
            <span
              className={`material-symbols-outlined ${
                transparent ? "text-white" : "text-primary"
              }`}
            >
              map
            </span>
          </Link>
          <div className="md:hidden">
            <MenuButton transparent={transparent} />
          </div>
        </div>
      </div>
    </header>
  );
}
