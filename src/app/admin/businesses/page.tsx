"use client";

import Link from "next/link";
import BusinessesEditor from "@/components/admin/BusinessesEditor";

export default function AdminBusinessesPage() {
  return (
    <div className="min-h-screen bg-surface-container-low">
      <header className="bg-primary text-on-primary px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="hover:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline font-bold text-lg">Businesses & Partners</h1>
          </div>
          <Link
            href="/admin/rewards"
            className="text-sm hover:underline opacity-80"
          >
            Offers & rewards
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <p className="text-sm text-secondary">
          All partner businesses along the trail. Each business appears on the
          markers it&apos;s linked to and on its own page (/biz/…). Discount
          offers are managed on the{" "}
          <Link href="/admin/rewards" className="text-primary font-bold hover:underline">
            Rewards
          </Link>{" "}
          page.
        </p>
        <BusinessesEditor />
      </main>
    </div>
  );
}
