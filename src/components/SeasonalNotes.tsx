"use client";

interface SeasonalNote {
  icon: string;
  text: string;
  months: string;
}

interface SeasonalNotesProps {
  notes: SeasonalNote[];
}

export default function SeasonalNotes({ notes }: SeasonalNotesProps) {
  if (notes.length === 0) return null;

  const currentMonth = new Date().getMonth(); // 0-11
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function isActive(months: string): boolean {
    // Parse "May-Jul" or "Year-round" format
    if (months === "Year-round") return true;
    const parts = months.split("-").map((m) => m.trim());
    if (parts.length !== 2) return true;
    const startIdx = monthNames.findIndex((mn) => parts[0].startsWith(mn));
    const endIdx = monthNames.findIndex((mn) => parts[1].startsWith(mn));
    if (startIdx === -1 || endIdx === -1) return true;
    if (startIdx <= endIdx) {
      return currentMonth >= startIdx && currentMonth <= endIdx;
    }
    return currentMonth >= startIdx || currentMonth <= endIdx;
  }

  const activeNotes = notes.filter((n) => isActive(n.months));
  const inactiveNotes = notes.filter((n) => !isActive(n.months));

  if (activeNotes.length === 0 && inactiveNotes.length === 0) return null;

  return (
    <section className="px-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">eco</span>
        <h3 className="font-headline font-bold text-lg">Look Out For</h3>
      </div>

      {activeNotes.length > 0 && (
        <div className="space-y-2">
          {activeNotes.map((note, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-primary-fixed/30 rounded-md p-4"
            >
              <span className="material-symbols-outlined text-primary text-lg mt-0.5">
                {note.icon}
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-on-surface">{note.text}</p>
                <p className="text-[10px] text-primary font-bold mt-1">
                  Active now · {note.months}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {inactiveNotes.length > 0 && (
        <div className="space-y-2">
          {inactiveNotes.map((note, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-surface-container rounded-md p-4"
            >
              <span className="material-symbols-outlined text-secondary text-lg mt-0.5">
                {note.icon}
              </span>
              <div className="flex-1">
                <p className="text-sm text-on-surface">{note.text}</p>
                <p className="text-[10px] text-secondary mt-1">{note.months}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
