interface Stat {
  label: string;
  value: string;
  unit?: string;
}

export default function StatsRibbon({ stats }: { stats: Stat[] }) {
  return (
    <section className="bg-surface-container-high py-8 overflow-x-auto no-scrollbar whitespace-nowrap">
      <div className="max-w-7xl mx-auto flex items-center justify-around px-6 gap-12">
        {stats.map((stat, i) => (
          <div key={stat.label} className="flex items-center gap-12">
            <div className="flex flex-col items-center min-w-[100px]">
              <span className="font-label text-secondary text-[10px] uppercase tracking-widest mb-1">
                {stat.label}
              </span>
              <span className="font-headline text-3xl font-bold text-primary">
                {stat.value}
                {stat.unit && (
                  <span className="text-sm font-medium ml-1">{stat.unit}</span>
                )}
              </span>
            </div>
            {i < stats.length - 1 && (
              <div className="h-12 w-[2px] bg-tertiary/20" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
