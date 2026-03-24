export default function ScanCounter({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-center gap-2 py-3 text-on-surface-variant">
        <span className="material-symbols-outlined text-base">hiking</span>
        <p className="text-sm">
          <span className="font-semibold">{count.toLocaleString()}</span> walkers
          have scanned here
        </p>
      </div>
    </div>
  );
}
