import { FIRST_STRETCH_KM } from "@/content/launch";
import { PLACES, STRIP, pts } from "@/lib/launch/geo";

/** The printable map's cover, drawn on a sheet folded in three. */
function Sheet() {
  const line = STRIP.map((x, i) => ({ s: i / 10, x })).filter((_, i) => i % 3 === 0);
  const L = line.length;
  const P = (o: { x: number }, i: number) => [24 + (i / (L - 1)) * 252, 106 - o.x * 26];
  return (
    <svg viewBox="0 0 300 212" preserveAspectRatio="none">
      <rect x={0} y={0} width={300} height={212} fill="#f3eee2" />
      {Array.from({ length: 14 }, (_, i) => (
        <line key={i} x1={0} y1={i * 16} x2={300} y2={i * 16} stroke="#1d3024" strokeOpacity={0.05} />
      ))}
      <polyline
        points={pts(line.map(P))}
        fill="none"
        stroke="#9a3412"
        strokeWidth={2.2}
        strokeDasharray="4 3"
        strokeLinecap="round"
      />
      {/* villages only: marker positions stay off every map until each post is agreed */}
      {PLACES.filter((pl) => pl.kind === "settlement" && pl.km <= FIRST_STRETCH_KM).map((pl) => {
        const idx = line.reduce((b, c, j) => (Math.abs(c.s - pl.km) < Math.abs(line[b].s - pl.km) ? j : b), 0);
        const [x, y] = P(line[idx], idx);
        return (
          <g key={pl.name}>
            <circle cx={x} cy={y} r={3.4} fill="#154212" />
            <text
              x={x < 60 ? x - 4 : x}
              y={y + (idx % 2 ? -8 : 15)}
              textAnchor={x < 60 ? "start" : "middle"} className="bodyfont" fontWeight={600} fontSize={7.5} fill="#1d3024">
              {pl.name}
            </text>
          </g>
        );
      })}
      <text x={16} y={26} className="displayfont" fontWeight={800} fontSize={15} fill="#154212">
        TrailTap · The first stretch
      </text>
      <text x={16} y={42} className="bodyfont" fontWeight={600} fontSize={8.5} fill="#4f5b51">
        Water · food · toilets · climbs · parking · buses · free to print
      </text>
      <text x={284} y={198} textAnchor="end" className="mapfont" fontStyle="italic" fontSize={10} fill="#4f5b51">
        Chipping Campden to Cleeve Hill
      </text>
    </svg>
  );
}

export default function FoldMap() {
  return (
    <div className="fold-shadow rv">
      <div className="fold" aria-hidden="true">
        <div>
          <Sheet />
        </div>
        <div>
          <Sheet />
        </div>
        <div>
          <Sheet />
        </div>
      </div>
    </div>
  );
}
