import Link from "next/link";
import { getMarkers } from "@/data/markers";

export const metadata = {
  title: "Admin Dashboard | Cotswold Way Markers",
};

export default async function AdminDashboard() {
  const markers = await getMarkers();

  return (
    <div className="min-h-screen bg-surface-container-low">
      {/* Header */}
      <header className="bg-primary text-on-primary px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">admin_panel_settings</span>
            <h1 className="font-headline font-bold text-lg">
              Marker Admin
            </h1>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href="/admin/analytics" className="hover:underline opacity-80 hover:opacity-100">
              Analytics
            </Link>
            <Link href="/" className="hover:underline opacity-80 hover:opacity-100">
              View site
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-xl font-bold text-primary">
            All Markers ({markers.length})
          </h2>
        </div>

        {/* Markers table */}
        <div className="bg-surface rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant text-left">
                  <th className="px-4 py-3 font-semibold text-on-surface-variant">Code</th>
                  <th className="px-4 py-3 font-semibold text-on-surface-variant">Name</th>
                  <th className="px-4 py-3 font-semibold text-on-surface-variant text-center">Mile</th>
                  <th className="px-4 py-3 font-semibold text-on-surface-variant text-center">Day</th>
                  <th className="px-4 py-3 font-semibold text-on-surface-variant text-center">Facilities</th>
                  <th className="px-4 py-3 font-semibold text-on-surface-variant text-center">Status</th>
                  <th className="px-4 py-3 font-semibold text-on-surface-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {markers.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-on-primary text-xs font-bold">
                        {m.shortCode.replace("CW", "")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-on-surface">{m.name}</p>
                      <p className="text-xs text-on-surface-variant">{m.segment}</p>
                    </td>
                    <td className="px-4 py-3 text-center">{m.trailMile}</td>
                    <td className="px-4 py-3 text-center">{m.dayOnTrail}</td>
                    <td className="px-4 py-3 text-center">{m.facilities.length}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          m.isActive
                            ? "bg-primary-fixed text-on-primary-fixed"
                            : "bg-surface-container-highest text-on-surface-variant"
                        }`}
                      >
                        {m.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/m/${m.shortCode}`}
                          className="text-on-surface-variant hover:text-primary"
                          title="View marker"
                        >
                          <span className="material-symbols-outlined text-lg">
                            visibility
                          </span>
                        </Link>
                        <Link
                          href={`/admin/markers/${m.id}`}
                          className="text-on-surface-variant hover:text-primary"
                          title="Edit marker"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
