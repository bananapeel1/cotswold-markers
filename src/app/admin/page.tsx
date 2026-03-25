import Link from "next/link";
import { getMarkers } from "@/data/markers";

export const metadata = {
  title: "TrailTap | Command Center",
};

export default async function AdminDashboard() {
  const markers = await getMarkers();
  const totalScans = 2847;
  const activeCount = markers.filter((m) => m.isActive).length;

  return (
    <>
      {/* Top Nav */}
      <nav className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md flex justify-between items-center h-16 px-6">
        <div className="flex items-center gap-4">
          <span className="text-xl font-black text-primary tracking-tighter font-headline">
            TrailTap
          </span>
          <div className="hidden md:flex items-center ml-8 gap-6">
            <Link href="/admin" className="text-primary font-bold font-headline transition-colors">
              Dashboard
            </Link>
            <Link href="/admin/analytics" className="text-secondary font-bold font-headline hover:text-primary transition-colors">
              Analytics
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-full hover:bg-surface-container transition-colors active:scale-95">
            <span className="material-symbols-outlined text-secondary">language</span>
          </Link>
        </div>
      </nav>

      <div className="flex pt-16 min-h-screen">
        {/* Sidebar — desktop only */}
        <aside className="hidden md:flex flex-col w-64 bg-surface-container fixed h-[calc(100vh-4rem)] p-6 gap-2">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-4 px-4">
              Menu
            </p>
            <nav className="space-y-1">
              {[
                { icon: "dashboard", label: "Overview", active: true, href: "/admin" },
                { icon: "location_on", label: "Markers", active: false, href: "/admin" },
                { icon: "handshake", label: "Sponsors", active: false, href: "/sponsors" },
                { icon: "settings", label: "Settings", active: false, href: "/admin" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full transition-all ${
                    item.active
                      ? "bg-surface-container-high text-primary font-semibold"
                      : "text-secondary hover:bg-surface-container-high/50"
                  }`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto bg-primary-container p-6 rounded-md text-on-primary relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-bold opacity-80 uppercase tracking-tighter mb-1">
                System Health
              </p>
              <p className="text-xl font-bold font-headline mb-4">All Systems Normal</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-8xl">check_circle</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-64 p-6 lg:p-10 bg-surface">
          {/* Header */}
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight text-primary leading-none">
                Command Center
              </h1>
              <p className="text-secondary mt-2">
                Real-time status of your TrailTap marker network.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin/analytics"
                className="bg-surface-container-high text-primary font-bold px-6 py-3 rounded-full flex items-center gap-2 hover:bg-surface-variant transition-all"
              >
                <span className="material-symbols-outlined">analytics</span>
                Analytics
              </Link>
            </div>
          </header>

          {/* Stats Bento */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { label: "Total Scans", value: totalScans.toLocaleString(), trend: "+12% this month", trendIcon: "trending_up", trendColor: "text-primary", bgIcon: "qr_code_2" },
              { label: "Active Markers", value: String(activeCount), trend: "100% Uptime", trendIcon: "check_circle", trendColor: "text-tertiary", bgIcon: "distance" },
              { label: "Redemption Rate", value: "18%", trend: "-2% from last week", trendIcon: "info", trendColor: "text-error", bgIcon: "loyalty" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-surface-container-lowest p-8 rounded-md shadow-ambient flex flex-col relative overflow-hidden group"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">
                  {stat.label}
                </span>
                <span className="text-5xl font-black font-headline text-primary">
                  {stat.value}
                </span>
                <div className={`mt-4 flex items-center gap-2 ${stat.trendColor}`}>
                  <span className="material-symbols-outlined text-sm">{stat.trendIcon}</span>
                  <span className="text-xs font-bold font-label">{stat.trend}</span>
                </div>
                <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                  <span className="material-symbols-outlined text-[120px]">{stat.bgIcon}</span>
                </div>
              </div>
            ))}
          </section>

          {/* Marker Table */}
          <section className="bg-surface-container-lowest rounded-md shadow-ambient overflow-hidden">
            <div className="p-6 border-b border-surface-variant flex items-center justify-between">
              <h3 className="text-xl font-bold font-headline text-primary">
                Marker Inventory
              </h3>
              <div className="flex items-center bg-surface-container px-3 py-1.5 rounded-full">
                <span className="material-symbols-outlined text-secondary text-sm mr-2">search</span>
                <span className="text-xs text-secondary/50">Filter markers...</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Code</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Location</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Mile</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {markers.map((m) => (
                    <tr key={m.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-primary">
                        {m.shortCode}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold">{m.name}</p>
                        <p className="text-[10px] text-secondary">{m.segment}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          m.isActive
                            ? "bg-primary-fixed text-on-primary-fixed-variant"
                            : "bg-error-container text-on-error-container"
                        }`}>
                          {m.isActive ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold">{m.trailMile}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`/m/${m.shortCode}`} className="text-secondary hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </Link>
                          <Link href={`/admin/markers/${m.id}`} className="text-secondary hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-surface-container-high bg-surface-container-low flex justify-between items-center">
              <span className="text-[10px] font-bold text-secondary">
                Showing {markers.length} of {markers.length} markers
              </span>
            </div>
          </section>
        </main>
      </div>

    </>
  );
}
