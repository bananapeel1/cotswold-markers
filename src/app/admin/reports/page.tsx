import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import ReportModeration from "@/components/admin/ReportModeration";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TrailTap | Marker Reports",
};

export default function AdminReportsPage() {
  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md flex justify-between items-center h-16 px-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-xl font-black text-primary tracking-tighter font-headline">
            TrailTap
          </Link>
          <span className="text-secondary text-sm font-medium">/ Reports</span>
        </div>
        <LogoutButton />
      </nav>

      <main className="pt-20 pb-8 px-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black font-headline">Marker Reports</h1>
          <Link
            href="/admin"
            className="text-xs font-bold text-secondary hover:text-primary transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <ReportModeration />
      </main>
    </>
  );
}
