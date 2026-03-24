import { EmergencyInfo } from "@/data/types";

export default function EmergencyBanner({ info }: { info: EmergencyInfo }) {
  return (
    <section className="bg-surface-container rounded-md p-6 space-y-4 mx-4">
      <div className="flex items-center gap-2 text-error">
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          emergency
        </span>
        <span className="font-bold text-sm">Emergency Info</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="font-label text-[10px] font-bold text-secondary uppercase tracking-widest">
            OS Grid Ref
          </p>
          <p className="font-mono text-sm font-bold">{info.gridReference}</p>
        </div>
        <div className="space-y-1">
          <p className="font-label text-[10px] font-bold text-secondary uppercase tracking-widest">
            What3Words
          </p>
          <p className="font-mono text-sm font-bold text-tertiary">
            ///{info.what3words}
          </p>
        </div>
      </div>
      <a
        href="tel:999"
        className="w-full bg-error text-on-error py-4 rounded-full font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined">call</span>
        EMERGENCY CALL (999)
      </a>
    </section>
  );
}
