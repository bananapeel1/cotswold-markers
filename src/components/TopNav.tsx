import Link from "next/link";
import MenuDrawer from "./MenuDrawer";

interface TopNavProps {
  showBack?: boolean;
  backHref?: string;
  desktopLinks?: boolean;
  transparent?: boolean;
}

export default function TopNav({
  showBack = false,
  backHref = "/",
  desktopLinks = false,
  transparent = false,
}: TopNavProps) {
  return (
    <header
      className={`fixed top-0 w-full z-50 flex justify-between items-center h-16 px-6 ${
        transparent
          ? "bg-transparent"
          : "bg-surface/90 backdrop-blur-md"
      }`}
    >
      <div className="flex items-center gap-4">
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
        <Link href="/" className="text-xl font-black text-primary tracking-tighter font-headline">
          TrailTap
        </Link>
        {desktopLinks && (
          <div className="hidden md:flex items-center ml-8 gap-6">
            <Link href="/" className="text-primary font-bold font-headline transition-colors">
              Home
            </Link>
            <Link href="/trail" className="text-secondary font-bold font-headline hover:text-primary transition-colors">
              Explore
            </Link>
            <Link href="/sponsors" className="text-secondary font-bold font-headline hover:text-primary transition-colors">
              Partners
            </Link>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/trail"
          className="hidden md:flex active:scale-95 transition-transform p-2 hover:bg-surface-container/50 rounded-full"
        >
          <span className="material-symbols-outlined text-primary">map</span>
        </Link>
        <MenuDrawer />
      </div>
    </header>
  );
}
