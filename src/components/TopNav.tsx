import Link from "next/link";

interface TopNavProps {
  showBack?: boolean;
  backHref?: string;
  rightAction?: "map" | "none";
  desktopLinks?: boolean;
}

export default function TopNav({
  showBack = false,
  backHref = "/",
  rightAction = "map",
  desktopLinks = false,
}: TopNavProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md flex justify-between items-center h-16 px-6">
      <div className="flex items-center gap-4">
        {showBack && (
          <Link
            href={backHref}
            className="active:scale-95 transition-transform p-2 hover:bg-surface-container rounded-full"
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
      <div className="flex items-center gap-3">
        {rightAction === "map" && (
          <Link
            href="/trail"
            className="active:scale-95 transition-transform p-2 hover:bg-surface-container rounded-full"
          >
            <span className="material-symbols-outlined text-primary">map</span>
          </Link>
        )}
      </div>
    </header>
  );
}
