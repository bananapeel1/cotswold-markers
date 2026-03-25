import Link from "next/link";
import Image from "next/image";
import { MenuButton } from "./MenuDrawer";

interface TopNavProps {
  showBack?: boolean;
  backHref?: string;
  desktopLinks?: boolean;
}

export default function TopNav({
  showBack = false,
  backHref = "/",
  desktopLinks = false,
}: TopNavProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md h-16 px-6">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        {/* Left: back + logo */}
        <div className="flex items-center gap-3">
          {showBack && (
            <Link
              href={backHref}
              className="active:scale-95 transition-transform p-2 hover:bg-surface-container/50 rounded-full"
            >
              <span className="material-symbols-outlined text-primary">
                arrow_back
              </span>
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="TrailTap"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-xl font-black text-primary tracking-tighter font-headline">
              TrailTap
            </span>
          </Link>
        </div>

        {/* Center: desktop nav links */}
        {desktopLinks && (
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="text-primary font-bold font-headline hover:opacity-80 transition-opacity">
              Home
            </Link>
            <Link href="/trail" className="text-secondary font-bold font-headline hover:text-primary transition-colors">
              Explore
            </Link>
            <Link href="/sponsors" className="text-secondary font-bold font-headline hover:text-primary transition-colors">
              Partners
            </Link>
          </nav>
        )}

        {/* Right: map icon (desktop) + hamburger (mobile only) */}
        <div className="flex items-center gap-2">
          <Link
            href="/trail"
            className="hidden md:flex active:scale-95 transition-transform p-2 hover:bg-surface-container/50 rounded-full"
          >
            <span className="material-symbols-outlined text-primary">map</span>
          </Link>
          <div className="md:hidden">
            <MenuButton />
          </div>
        </div>
      </div>
    </header>
  );
}
