import { Marker } from "@/data/types";

export default function MarkerHeader({ marker }: { marker: Marker }) {
  return (
    <section className="mt-4 px-4">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="material-symbols-outlined text-primary text-sm"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          location_on
        </span>
        <span className="font-label text-xs font-bold uppercase tracking-widest text-secondary">
          Current Location
        </span>
      </div>
      <h2 className="text-4xl font-headline font-extrabold tracking-tight text-primary leading-none">
        {marker.name}
      </h2>
    </section>
  );
}
